import { getAllEvents } from "../../ftc-api/get-events";
import { Season } from "../../ftc-api/types/Season";
import { FTCSDataSource } from "../data-source";
import { FtcApiMetadata } from "../entities/FtcApiMetadata";
import { Event } from "../../db/entities/Event";
import { DeepPartial } from "typeorm";
import { DB_CHUNK_SIZE } from "../../constants";

export async function loadAllEvents(season: Season) {
    console.log(`Fetching all events for season ${season}.`);

    let dateStartQuery = new Date();
    let since = await FtcApiMetadata.getLastEventsReq(season);
    let apiEvents = await getAllEvents(season, since);

    console.log("Fetched all Events.");

    console.log("Adding all events to database.");

    let dbEvents: Event[] = apiEvents.map((apiEvent) => {
        return Event.create({
            eventId: apiEvent.eventId,
            season,
            code: apiEvent.code,
            divisionCode:
                apiEvent?.divisionCode === "" ? null : apiEvent.divisionCode,
            name: apiEvent.name,
            remote: apiEvent.remote,
            hybrid: apiEvent.hybrid,
            fieldCount: apiEvent.fieldCount,
            published: apiEvent.published,
            type: +apiEvent.type!,
            regionCode: apiEvent.regionCode,
            leagueCode: apiEvent.leagueCode,
            districtCode:
                apiEvent.districtCode === "" ? null : apiEvent.districtCode,
            venue: apiEvent.venue,
            address: apiEvent.address,
            country: apiEvent.country,
            stateOrProvince: apiEvent.stateprov,
            city: apiEvent.city,
            website: apiEvent.website === "" ? null : apiEvent.website,
            liveStreamURL:
                apiEvent.liveStreamUrl === "" ? null : apiEvent.liveStreamUrl,
            webcasts: apiEvent.webcasts ?? [],
            timezone: apiEvent.timezone,
            start: new Date(apiEvent.dateStart),
            end: new Date(apiEvent.dateEnd),
        } as DeepPartial<Event>);
    });

    await FTCSDataSource.transaction(async (em) => {
        await em.save(dbEvents, { chunk: DB_CHUNK_SIZE });
        await em.save(
            FtcApiMetadata.create({
                season,
                lastEventsReq: dateStartQuery,
            })
        );
    });

    console.log("All events added to database.");
}
