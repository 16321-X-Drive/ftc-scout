import {
    DESCRIPTORS,
    EventTypeOption,
    MatchFtcApi,
    MatchScoresFtcApi,
    Season,
    calculateTeamEventStats,
    getEventTypes,
    groupBy,
} from "@ftc-scout/common";
import { DataHasBeenLoaded } from "../entities/DataHasBeenLoaded";
import { Event } from "../entities/Event";
import { DATA_SOURCE } from "../data-source";
import { Match } from "../entities/Match";
import { getMatches } from "../../ftc-api/get-matches";
import { getMatchScores } from "../../ftc-api/get-match-scores";
import { getTeams } from "../../ftc-api/get-teams";
import { MatchScore, MatchScoreSchemas } from "../entities/dyn/match-score";
import { TeamMatchParticipation } from "../entities/TeamMatchParticipation";
import { LoadType } from "../../ftc-api/watch";
import {
    TeamEventParticipation,
    TeamEventParticipationSchemas as TepSchemas,
} from "../entities/dyn/team-event-participation";
import { exit } from "process";
import { IS_DEV } from "../../constants";
import { newMatchesKey, pubsub } from "../../graphql/resolvers/pubsub";

const IGNORED_MATCHES = [
    //cSpell:disable
    { season: Season.UltimateGoal, eventCode: "USNYEXS1", teamNumber: 14903 },
    { season: Season.UltimateGoal, eventCode: "USNYEXS1", teamNumber: 17222 },
    { season: Season.UltimateGoal, eventCode: "USNJCWS1", teamNumber: 9889 },
    //cSpell:enable
];

function isIgnored(season: Season, eCode: string, m: MatchFtcApi): boolean {
    return IGNORED_MATCHES.some(
        (im) =>
            im.season == season &&
            im.eventCode == eCode &&
            m.teams.some((t) => im.teamNumber == t.teamNumber)
    );
}

export async function loadAllMatches(season: Season, loadType: LoadType) {
    console.info(`Loading matches for season ${season}. (${loadType})`);

    let events = await eventsToFetch(season, loadType);

    console.info(`Got ${events.length} events to fetch.`);

    for (let i = 0; i < events.length; i++) {
        let event = events[i];

        if (event.remote && !DESCRIPTORS[season].hasRemote) continue;

        try {
            let [matches, scores, teams] = await Promise.all([
                getMatches(season, event.code),
                getMatchScores(season, event.code),
                getTeams(season, event.code),
            ]);

            let allDbMatches: Match[] = [];
            let allDbScores: MatchScore[] = [];
            let allDbTmps: TeamMatchParticipation[] = [];

            for (let match of matches) {
                if (isIgnored(season, event.code, match)) continue;

                let theseScores = findScores(match, scores);
                let hasBeenPlayed = !!theseScores.length;
                let dbMatch = Match.fromApi(match, event, hasBeenPlayed);
                let dbTmps = TeamMatchParticipation.fromApi(match.teams, dbMatch, event.remote);
                let dbScores =
                    event.remote && dbTmps[0].noShow
                        ? [] // Remote matches that weren't played still return scores
                        : theseScores.flatMap((s) => MatchScore.fromApi(s, dbMatch, event.remote));

                dbMatch.teams = dbTmps;
                dbMatch.scores = dbScores;

                allDbMatches.push(dbMatch);
                allDbScores.push(...dbScores);
                allDbTmps.push(...dbTmps);
            }

            // We can't just use the teams list because it sometimes misses teams?
            // Ex. team 23512 here https://ftc-events.firstinspires.org/2023/USCANOCMPSI/qualifications
            let allTeams = allDbMatches.flatMap((m) => m.teams.map((t) => t.teamNumber));
            allTeams = allTeams.concat(teams.map((t) => t.teamNumber));
            allTeams = [...new Set(allTeams)];

            let allDbTeps: Partial<TeamEventParticipation>[] = calculateTeamEventStats(
                season,
                event.code,
                event.remote,
                allDbMatches.map((m) => m.toFrontend()),
                allTeams
            );
            await DATA_SOURCE.transaction(async (em) => {
                await em.save(allDbMatches, { chunk: 100 });
                await em.save(allDbTmps, { chunk: 500 });
                await em.getRepository(MatchScoreSchemas[season]).save(allDbScores, { chunk: 100 });
                await em.getRepository(TepSchemas[season]).save(allDbTeps, { chunk: 100 });
            });

            let updatedScores = allDbScores.filter((m) => "updatedAt" in m);
            let updatedTmps = allDbTmps.filter((tmp) => "updatedAt" in tmp);
            let updatedMatches = allDbMatches.filter((m) => {
                return (
                    "updatedAt" in (m as any) ||
                    updatedScores.some((s) => m.eventCode == s.eventCode && m.id == s.matchId) ||
                    updatedTmps.some((tmp) => m.eventCode == tmp.eventCode && m.id == tmp.matchId)
                );
            });

            publishMatchUpdates(updatedMatches);

            console.info(`Loaded ${i + 1}/${events.length}.`);
        } catch (e) {
            console.error(`Loaded ${i + 1}/${events.length} !!! ERROR !!!`);
            console.error(e);

            if (IS_DEV) {
                exit(1);
            }
        }
    }

    await DataHasBeenLoaded.create({
        season,
        matches: true,
    }).save({ chunk: 100 });

    console.info(`Finished loading events.`);
}

function findScores(match: MatchFtcApi, scores: MatchScoresFtcApi[]): MatchScoresFtcApi[] {
    return scores.filter((s) =>
        "teamNumber" in s
            ? match.teams[0].teamNumber == s.teamNumber && match.matchNumber == s.matchNumber
            : match.tournamentLevel == s.matchLevel &&
              match.series == s.matchSeries &&
              match.matchNumber == s.matchNumber
    );
}

async function eventsToFetch(season: Season, loadType: LoadType) {
    let loaded = await DataHasBeenLoaded.matchesHaveBeenLoaded(season);
    if (!loaded) {
        return Event.findBy({ season });
    }

    if (loadType == LoadType.Full) {
        return DATA_SOURCE.getRepository(Event)
            .createQueryBuilder("e")
            .select(["e.season", "e.code", "e.remote", "e.timezone"])
            .distinct(true)
            .leftJoin(Match, "m", "e.season = m.event_season AND e.code = m.event_code")
            .leftJoin(
                `match_score_${season}`,
                "s",
                "s.season = m.event_season AND s.event_code = m.event_code AND m.id = s.match_id"
            )
            .where("e.season = :season", { season })
            .andWhere("start < now()")
            .andWhere("start > 'now'::timestamp - '1 month'::interval")
            .andWhere("type IN (:...types)", { types: getEventTypes(EventTypeOption.Competition) })
            .getMany();
    } else {
        return DATA_SOURCE.getRepository(Event)
            .createQueryBuilder("e")
            .select(["e.season", "e.code", "e.remote", "e.timezone"])
            .distinct(true)
            .where("season = :season", { season })
            .andWhere("start <= (NOW() at time zone timezone)::date")
            .andWhere(`"end" >= (NOW() at time zone timezone)::date`)
            .andWhere("type IN (:...types)", { types: getEventTypes(EventTypeOption.Competition) })
            .getMany();
    }
}

function publishMatchUpdates(matches: Match[]) {
    let grouped = groupBy(matches, (m) => m.eventCode);

    for (let eventCode of Object.keys(grouped)) {
        let eMatches = grouped[eventCode];
        pubsub.publish(newMatchesKey(matches[0].eventSeason, eventCode), { newMatches: eMatches });
    }
}
