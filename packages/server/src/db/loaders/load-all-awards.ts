import { AwardFtcApi, Season, notEmpty } from "@ftc-scout/common";
import { DataHasBeenLoaded } from "../entities/DataHasBeenLoaded";
import { Event } from "../entities/Event";
import { DATA_SOURCE } from "../data-source";
import { getEventAwards } from "../../ftc-api/get-event-awards";
import { Award } from "../entities/Award";
import { LoadType } from "../../ftc-api/watch";

export async function loadAllAwards(season: Season, loadType: LoadType) {
    console.info(`Loading awards for season ${season}. (${loadType})`);

    let events = await eventsToFetch(season, loadType);

    console.info(`Got ${events.length} events to fetch.`);

    const chunkSize = 25;
    for (let i = 0; i < events.length; i += chunkSize) {
        console.info(`Starting chunk starting at ${i}.`);
        console.info("Fetching from api.");

        let chunk = events.slice(i, i + chunkSize);
        let apiAwards = await Promise.all(chunk.map((e) => getEventAwards(season, e.code)));
        apiAwards.forEach(fixJudgesChoice);
        let dbAwards = apiAwards
            .flat()
            .map((a) => Award.fromApi(season, a))
            .filter(notEmpty);
        await Award.save(dbAwards, { chunk: 100 });

        console.info(`Loaded ${Math.min(i + chunkSize, events.length) + 1}/${events.length}.`);
    }

    await DataHasBeenLoaded.create({
        season,
        awards: true,
    }).save({ chunk: 100 });

    console.info(`Finished loading awards.`);
}

function fixJudgesChoice(awards: AwardFtcApi[]) {
    // For some reason the api sometimes reports the judges choice award as starting from 0 instead of 1.
    // We correct that here.
    let hasZeroJudgesChoice = awards.some((a) => a.name == "Judges' Choice Award" && a.series == 0);
    if (hasZeroJudgesChoice) {
        awards.forEach((a) => {
            if (a.name == "Judges' Choice Award") a.series++;
        });
    }
}

async function eventsToFetch(season: Season, loadType: LoadType) {
    let loaded = await DataHasBeenLoaded.awardsHaveBeenLoaded(season);

    if (loaded) {
        let query = DATA_SOURCE.getRepository(Event)
            .createQueryBuilder("e")
            .select(["e.season", "e.code"])
            .where("season = :season", { season });

        if (loadType == LoadType.Full) {
            query
                .andWhere("start < now()")
                .andWhere("start > 'now'::timestamp - '7 days'::interval");
        } else {
            query
                .andWhere("start <= (NOW() at time zone timezone)::date")
                .andWhere(`"end" >= (NOW() at time zone timezone)::date`);
        }

        return query.getMany();
    } else {
        return Event.findBy({ season });
    }
}
