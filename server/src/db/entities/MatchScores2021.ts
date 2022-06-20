import { Field, Int, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    DeepPartial,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm";
import { Season } from "../../ftc-api/types/Season";
import { EVENT_CODE_LEN } from "./Event";
import { Match } from "./Match";
import { Alliance, allianceFromString } from "./types/Alliance";
import { TypeormLoader } from "type-graphql-dataloader";
import {
    BarcodeElement2021,
    barcodeElementFromApi,
} from "./types/2021/BarcodeElement2021";
import {
    AutoNavigation2021,
    autoNavigation2021FromApi,
} from "./types/2021/AutoNavigation2021";
import {
    EndgamePark2021,
    endgamePark2021FromApi,
} from "./types/2021/EndgamePark2021";
import { MatchScores2021RemoteFtcApi } from "../../ftc-api/types/match-scores/MatchScores2021Remote";
import { MatchScores2021TradFtcApi } from "../../ftc-api/types/match-scores/MatchScores2021Trad";

@ObjectType()
@Entity()
export class MatchScores2021 extends BaseEntity {
    @PrimaryColumn("smallint", { default: Season.FREIGHT_FRENZY })
    season!: Season;

    @PrimaryColumn({ length: EVENT_CODE_LEN })
    eventCode!: string;

    @PrimaryColumn("int")
    matchNum!: number;

    @Field(() => Alliance)
    @PrimaryColumn("enum", { enum: Alliance })
    alliance!: Alliance;

    @Field(() => Match)
    @ManyToOne(() => Match, (match) => match.scores2021)
    @JoinColumn([
        { name: "season", referencedColumnName: "eventSeason" },
        { name: "eventCode", referencedColumnName: "eventCode" },
        { name: "matchNum", referencedColumnName: "num" },
    ])
    @TypeormLoader()
    match!: Match;

    // @Field(() => Event)
    // @ManyToOne(() => Event)
    // @JoinColumn([
    //     { name: "season", referencedColumnName: "season" },
    //     { name: "eventCode", referencedColumnName: "code" },
    // ])
    // event!: Event;

    @Field(() => Int)
    @Column("int8")
    randomization!: number;

    @Field(() => BarcodeElement2021)
    @Column("enum", { enum: BarcodeElement2021 })
    barcodeElement!: BarcodeElement2021;

    @Field(() => BarcodeElement2021, { nullable: true })
    @Column("enum", { enum: BarcodeElement2021, nullable: true })
    barcodeElement2!: BarcodeElement2021 | null;

    @Field()
    @Column()
    autoCarousel!: boolean;

    @Field(() => AutoNavigation2021)
    @Column("enum", { enum: AutoNavigation2021 })
    autoNavigation!: AutoNavigation2021;

    @Field(() => AutoNavigation2021, { nullable: true })
    @Column("enum", { enum: AutoNavigation2021, nullable: true })
    autoNavigation2!: AutoNavigation2021 | null;

    @Field()
    @Column()
    autoBonus!: boolean;

    @Field(() => Boolean, { nullable: true })
    @Column("bool", { nullable: true })
    autoBonus2!: boolean;

    @Field(() => Int)
    @Column("int8")
    autoStorageFreight!: number;

    @Field(() => Int)
    @Column("int8")
    autoFreight1!: number;

    @Field(() => Int)
    @Column("int8")
    autoFreight2!: number;

    @Field(() => Int)
    @Column("int8")
    autoFreight3!: number;

    @Field(() => Int)
    @Column("int8")
    driverControlledStorageFreight!: number;

    @Field(() => Int)
    @Column("int8")
    driverControlledFreight1!: number;

    @Field(() => Int)
    @Column("int8")
    driverControlledFreight2!: number;

    @Field(() => Int)
    @Column("int8")
    driverControlledFreight3!: number;

    @Field(() => Int, { nullable: true })
    @Column("int8", { nullable: true })
    sharedFreight!: number | null;

    @Field(() => Int)
    @Column("int8")
    endgameDucksDelivered!: number;

    @Field()
    @Column()
    allianceBalanced!: boolean;

    @Field(() => Boolean, { nullable: true })
    @Column("bool", { nullable: true })
    sharedUnbalanced!: boolean | null;

    @Field(() => EndgamePark2021)
    @Column("enum", { enum: EndgamePark2021 })
    endgamePark!: EndgamePark2021;

    @Field(() => EndgamePark2021, { nullable: true })
    @Column("enum", { enum: EndgamePark2021, nullable: true })
    endgamePark2!: EndgamePark2021 | null;

    @Field(() => Int)
    @Column("int8")
    capped!: number;

    @Field(() => Int)
    @Column("int8")
    minorPenalties!: number;

    @Field(() => Int)
    @Column("int8")
    majorPenalties!: number;

    @Field(() => Int)
    @Column("int8")
    autoCarouselPoints!: number;

    @Field(() => Int)
    @Column("int8")
    autoNavigationPoints!: number;

    @Field(() => Int)
    @Column("int8")
    autoFreightPoints!: number;

    @Field(() => Int)
    @Column("int8")
    autoBonusPoints!: number;

    @Field(() => Int)
    @Column("int8")
    driverControlledAllianceHubPoints!: number;

    @Field(() => Int, { nullable: true })
    @Column("int8", { nullable: true })
    driverControlledSharedHubPoints!: number | null;

    @Field(() => Int)
    @Column("int8")
    driverControlledStoragePoints!: number;

    @Field(() => Int)
    @Column("int8")
    endgameDeliveryPoints!: number;

    @Field(() => Int)
    @Column("int8")
    allianceBalancedPoints!: number;

    @Field(() => Int, { nullable: true })
    @Column("int8", { nullable: true })
    sharedUnbalancedPoints!: number | null;

    @Field(() => Int)
    @Column("int8")
    endgameParkingPoints!: number;

    @Field(() => Int)
    @Column("int8")
    cappingPoints!: number;

    @Field(() => Int)
    @Column("smallint")
    autoPoints!: number;

    @Field(() => Int)
    @Column("smallint")
    driverControlledPoints!: number;

    @Field(() => Int)
    @Column("smallint")
    endgamePoints!: number;

    @Field(() => Int)
    @Column("smallint")
    penaltyPoints!: number;

    @Field(() => Int)
    @Column("smallint")
    totalPoints!: number;

    addGeneratedProps() {
        this.autoCarouselPoints = this.autoCarousel ? 10 : 0;
        this.autoNavigationPoints =
            [0, 3, 6, 5, 10][this.autoNavigation] +
            (this.autoNavigation2 != null
                ? [0, 3, 6, 5, 10][this.autoNavigation2]
                : 0);
        this.autoFreightPoints =
            this.autoStorageFreight * 2 +
            (this.autoFreight1 + this.autoFreight2 + this.autoFreight3) * 6;
        this.autoBonusPoints =
            (this.autoBonus
                ? this.barcodeElement == BarcodeElement2021.DUCK
                    ? 10
                    : 20
                : 0) +
            (this.autoBonus2
                ? this.barcodeElement == BarcodeElement2021.DUCK
                    ? 10
                    : 20
                : 0);
        this.driverControlledAllianceHubPoints =
            this.driverControlledFreight1 * 2 +
            this.driverControlledFreight2 * 4 +
            this.driverControlledFreight3 * 6;
        this.driverControlledSharedHubPoints =
            this.sharedFreight == null ? null : this.sharedFreight * 4;
        this.driverControlledStoragePoints =
            this.driverControlledStorageFreight * 1;
        this.endgameDeliveryPoints = this.endgameDucksDelivered * 6;
        this.allianceBalancedPoints = this.allianceBalanced ? 10 : 0;
        this.sharedUnbalancedPoints =
            this.sharedUnbalanced == null
                ? null
                : this.sharedUnbalanced
                ? 20
                : 0;
        this.endgameParkingPoints =
            [0, 3, 6][this.endgamePark] +
            (this.endgamePark2 != null ? [0, 3, 6][this.endgamePark2] : 0);
        this.cappingPoints = this.capped * 15;
        this.autoPoints =
            this.autoCarouselPoints +
            this.autoNavigationPoints +
            this.autoFreightPoints +
            this.autoBonusPoints;
        this.driverControlledPoints =
            this.driverControlledAllianceHubPoints +
            this.driverControlledStoragePoints +
            (this.driverControlledSharedHubPoints ?? 0);
        this.endgamePoints =
            this.endgameDeliveryPoints +
            this.allianceBalancedPoints +
            (this.sharedUnbalancedPoints ?? 0) +
            this.endgameParkingPoints +
            this.cappingPoints;
        this.penaltyPoints =
            this.majorPenalties * -30 + this.minorPenalties * -10;
        this.totalPoints =
            this.autoPoints +
            this.driverControlledPoints +
            this.endgamePoints +
            this.penaltyPoints;
    }

    static fromApiRemote(
        season: Season,
        eventCode: string,
        adjustedMatchNum: number,
        ms: MatchScores2021RemoteFtcApi
    ): MatchScores2021 {
        let s = ms.scores;
        let dbms = MatchScores2021.create({
            season,
            eventCode,
            matchNum: adjustedMatchNum,
            alliance: Alliance.SOLO,
            randomization: ms.randomization,
            barcodeElement: barcodeElementFromApi(s.barcodeElement),
            autoCarousel: s.carousel,
            autoNavigation: autoNavigation2021FromApi(s.autoNavigated),
            autoBonus: s.autoBonus,
            autoStorageFreight: s.autoStorageFreight,
            autoFreight1: s.autoFreight1,
            autoFreight2: s.autoFreight2,
            autoFreight3: s.autoFreight3,
            driverControlledStorageFreight: s.driverControlledStorageFreight,
            driverControlledFreight1: s.driverControlledFreight1,
            driverControlledFreight2: s.driverControlledFreight2,
            driverControlledFreight3: s.driverControlledFreight3,
            endgameDucksDelivered: s.endgameDelivered,
            allianceBalanced: s.allianceBalanced,
            endgamePark: endgamePark2021FromApi(s.endgameParked),
            capped: s.capped,
            minorPenalties: s.minorPenalties,
            majorPenalties: s.majorPenalties,
        } as DeepPartial<MatchScores2021>);
        dbms.addGeneratedProps();
        return dbms;
    }

    static fromTradApi(
        season: Season,
        eventCode: string,
        adjustedMatchNum: number,
        ms: MatchScores2021TradFtcApi
    ): MatchScores2021[] {
        return ms.alliances.map((a) => {
            let dbms = MatchScores2021.create({
                season,
                eventCode,
                matchNum: adjustedMatchNum,
                alliance: allianceFromString(a.alliance),
                randomization: ms.randomization,
                barcodeElement: barcodeElementFromApi(a.barcodeElement1),
                barcodeElement2: barcodeElementFromApi(a.barcodeElement2),
                autoCarousel: a.carousel,
                autoNavigation: autoNavigation2021FromApi(a.autoNavigated1),
                autoNavigation2: autoNavigation2021FromApi(a.autoNavigated2),
                autoBonus: a.autoBonus1,
                autoBonus2: a.autoBonus2,
                autoStorageFreight: a.autoStorageFreight,
                autoFreight1: a.autoFreight1,
                autoFreight2: a.autoFreight2,
                autoFreight3: a.autoFreight3,
                driverControlledStorageFreight:
                    a.driverControlledStorageFreight,
                driverControlledFreight1: a.driverControlledFreight1,
                driverControlledFreight2: a.driverControlledFreight2,
                driverControlledFreight3: a.driverControlledFreight3,
                sharedFreight: a.sharedFreight,
                endgameDucksDelivered: a.endgameDelivered,
                allianceBalanced: a.allianceBalanced,
                sharedUnbalanced: a.sharedUnbalanced,
                endgamePark: endgamePark2021FromApi(a.endgameParked1),
                endgamePark2: endgamePark2021FromApi(a.endgameParked2),
                capped: a.capped,
                minorPenalties: a.minorPenalties,
                majorPenalties: a.majorPenalties,
            } as DeepPartial<MatchScores2021>);
            dbms.addGeneratedProps();
            return dbms;
        });
    }
}
