import {
    BaseEntity,
    Column,
    CreateDateColumn,
    DeepPartial,
    Entity,
    OneToMany,
    PrimaryColumn,
    UpdateDateColumn,
} from "typeorm";
import { EventFtcApi, EventType, RegionCode, Season, eventTypeFromFtcApi } from "@ftc-scout/common";
import { Match } from "./Match";

@Entity()
export class Event extends BaseEntity {
    @PrimaryColumn("smallint")
    season!: Season;

    @PrimaryColumn()
    code!: string;

    @OneToMany(() => Match, (match) => match.event)
    matches!: Match[];

    @Column({ type: "varchar", nullable: true })
    divisionCode!: string | null;

    @Column()
    name!: string;

    @Column()
    remote!: boolean;

    @Column()
    hybrid!: boolean;

    @Column()
    fieldCount!: number;

    @Column()
    published!: boolean;

    @Column("enum", { enum: EventType, enumName: "event_type_enum" })
    type!: EventType;

    @Column({ type: "varchar", nullable: true })
    regionCode!: string | null;

    @Column({ type: "varchar", nullable: true })
    leagueCode!: string | null;

    @Column({ type: "varchar", nullable: true })
    districtCode!: string | null;

    @Column({ type: "varchar", nullable: true })
    venue!: string | null;

    @Column({ type: "varchar", nullable: true })
    address!: string | null;

    @Column()
    country!: string;

    @Column()
    state!: string;

    @Column()
    city!: string;

    @Column({ type: "varchar", nullable: true })
    website!: string | null;

    @Column({ type: "varchar", nullable: true })
    liveStreamURL!: string | null;

    @Column("json")
    webcasts!: string[];

    @Column({ type: "varchar" })
    timezone!: string;

    @Column("date")
    start!: Date;

    @Column("date")
    end!: Date;

    @Column()
    modifiedRules!: boolean;

    @CreateDateColumn({ type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updatedAt!: Date;

    static fromApi(api: EventFtcApi, season: Season): Event | null {
        let type = eventTypeFromFtcApi(api.typeName ?? "");
        if (
            api.code == null ||
            type == null ||
            api.country == null ||
            api.stateprov == null ||
            api.city == null
        ) {
            console.error(api, type);
            console.error(`Rejecting api event ${season} ${api.code}.`);
            return null;
        }

        const EVENT_RENAMING: Record<string, string> = {
            FTCCMP1: "FIRST World Championship - Finals Division",
            FTCCMP1FRNK: "FIRST World Championship - Franklin Division",
            FTCCMP1FRAN: "FIRST World Championship - Franklin Division",
            FTCCMP1JEMI: "FIRST World Championship - Jemison Division",
            FTCCMP1EDIS: "FIRST World Championship - Edison Division",
            FTCCMP1OCHO: "FIRST World Championship - Ochoa Division",

            // Old event division weren't named nicely. cspell:disable
            "19MICMP2": "FIRST in Michigan FTC State Championship - Warren",
            "19MICMP2MARIECURIE":
                "FIRST in Michigan FTC State Championship - Warren - Marie Curie Division",
            "19MICMP2WOODIEFLOWER":
                "FIRST in Michigan FTC State Championship - Warren - Woodie Flowers Division",

            "2019FLC1": "Florida FTC State Championship",
            "2019FLC1LAWRENCE": "Florida FTC State Championship - Lawrence Division",
            "2019FLC1SCOTT": "Florida FTC State Championship - Scott Division",

            "2019GACMP": "Georgia State Championship",
            "2019GACMPKILRAIN": "Georgia State Championship - Kilrain Division",
            "2019GACMPPEMBERTON": "Georgia State Championship - Pemberton Division",

            "2019IACMP1": "Iowa Championship",
            "2019IACMP1BLACK": "Iowa Championship - Black Division",
            "2019IACMP1GOLD": "Iowa Championship - Gold Division",

            "2019MOC1": "Missouri State Championship",
            "2019MOC1SDIVISION": "Missouri State Championship - S Division",
            "2019MOC1TDIVISION": "Missouri State Championship - T Division",

            "2019TXCCMP": "Central Texas FIRST Tech Challenge Regional Championship",
            "2019TXCCMPKANE":
                "Central Texas FIRST Tech Challenge Regional Championship - Kane Division",
            "2019TXCCMPNAYLOR":
                "Central Texas FIRST Tech Challenge Regional Championship - Naylor Division",

            "63707970587.8573": "2019-2020 MN FTC Stratasys State Championship",
            "63707970587.8573GALA":
                "2019-2020 MN FTC Stratasys State Championship - Galaxy Division",
            "63707970587.8573NANO": "2019-2020 MN FTC Stratasys State Championship - Nano Division",

            "63713064000.6815": ",MD-DC SKYSTONE Championship",
            "63713064000.6815COLL": "MD-DC SKYSTONE Championship - Collins Aerospace Division",
            "63713064000.6815KAHL": "MD-DC SKYSTONE Championship - Kahlert Division",

            AZFTCCP: "Arizona FIRST Tech Challenge Championship",
            AZFTCCPGRANDCANYON: "Arizona FIRST Tech Challenge Championship - Grand Canyon Division",
            AZFTCCPSAGUARO: "Arizona FIRST Tech Challenge Championship - Saguaro Division",

            LACHAMP: "Los Angeles Championship Monrovia, CA",
            LACHAMPGALILEO: "Los Angeles Championship Monrovia, CA - Galileo Division",
            LACHAMPODYSSEY: "Los Angeles Championship Monrovia, CA - Odyssey Division",
            NTXCH01: "North Texas FTC Regional Championship",
            NTXCH01RUBY: "North Texas FTC Regional Championship - Ruby Division",
            NTXCH01SAPPHIRE: "North Texas FTC Regional Championship - Sapphire Division",
            PACHAMP1: "Pennsylvania FTC Championship",
            PACHAMP1ALLEGHENY: "Pennsylvania FTC Championship - Allegheny Division",
            PACHAMP1POCONO: "Pennsylvania FTC Championship - Pocono Division",
            // cspell:enable
        };

        const MODIFIED_RULES = [
            // cspell:disable
            "USTXCECCS",
            // cspell:enable
        ];

        const MODIFIED_REGION_CODES: Record<string, RegionCode> = {
            NE: RegionCode.USNE,
        };

        return Event.create({
            season,
            code: api.code,
            divisionCode: api.divisionCode ? api.divisionCode : null,
            name: (EVENT_RENAMING[api.code] ?? api.name).trim(),
            remote: api.remote,
            hybrid: api.hybrid,
            fieldCount: api.fieldCount,
            published: api.published,
            type,
            regionCode: api.regionCode
                ? MODIFIED_REGION_CODES[api.regionCode] ?? api.regionCode
                : null,
            leagueCode: api.leagueCode,
            districtCode: api.districtCode ? api.districtCode : null,
            venue: api.venue?.trim() ?? null,
            address: api.address?.trim() ?? null,
            country: api.country,
            state: api.stateprov,
            city: api.city,
            website: api.website ? api.website.trim() : null,
            liveStreamURL:
                api.liveStreamUrl && api.liveStreamUrl.startsWith("https://")
                    ? api.liveStreamUrl.trim()
                    : null,
            webcasts: api.webcasts ? api.webcasts : [],
            timezone: api.timezone === "Asia/Calcutta"? "Asia/Kolkata" : api.timezone ?? "UTC",
            start: new Date(api.dateStart),
            end: new Date(api.dateEnd),
            modifiedRules: MODIFIED_RULES.indexOf(api.code) != -1,
        } satisfies DeepPartial<Event>);
    }
}
