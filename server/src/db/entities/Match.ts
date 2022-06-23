import { Field, Int, ObjectType } from "type-graphql";
import { TypeormLoader } from "type-graphql-dataloader";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
    UpdateDateColumn,
} from "typeorm";
import { Season } from "../../ftc-api/types/Season";
import { Event, EVENT_CODE_LEN } from "./Event";
import { MatchScores2021 } from "./MatchScores2021";
import { TeamMatchParticipation } from "./TeamMatchParticipation";
import { TournamentLevel } from "./types/TournamentLevel";

@ObjectType()
@Entity()
export class Match extends BaseEntity {
    @Field(() => Int, { name: "season" })
    @PrimaryColumn("smallint")
    eventSeason!: Season;

    @Field(() => String)
    @PrimaryColumn("varchar", { length: EVENT_CODE_LEN })
    eventCode!: string;

    @Field(() => Int)
    @PrimaryColumn("int")
    id!: number;

    static encodeMatchIdTraditional(
        matchNum: number,
        level: TournamentLevel,
        series: number
    ): number {
        return level.valueOf() * 10000 + series * 1000 + matchNum;
    }

    static encodeMatchIdRemote(matchNum: number, teamNum: number) {
        return teamNum * 1000 + matchNum;
    }

    @Field(() => Event)
    @ManyToOne(() => Event, (event) => event.matches)
    @TypeormLoader()
    event!: Event;

    @Field()
    @Column()
    hasBeenPlayed!: boolean;

    @Field(() => [TeamMatchParticipation])
    @OneToMany(() => TeamMatchParticipation, (tmp) => tmp.match)
    @TypeormLoader()
    teams!: TeamMatchParticipation[];

    @Field()
    @Column()
    scheduledStartTime!: Date;

    @Field(() => Date, { nullable: true })
    @Column("timestamptz", { nullable: true })
    actualStartTime!: Date | null;

    @Field(() => Date, { nullable: true })
    @Column("timestamptz", { nullable: true })
    postResultTime!: Date | null;

    @Field(() => Int)
    get matchNum(): number {
        return this.id % 1000;
    }

    @Field(() => TournamentLevel)
    @Column("enum", { enum: TournamentLevel })
    tournamentLevel!: TournamentLevel;

    @Field(() => Int)
    @Column("int8")
    series!: number;

    @Field(() => String)
    get matchDescription(): string {
        switch (this.tournamentLevel) {
            case TournamentLevel.QUALS:
                return `Q-${this.matchNum}`;
            case TournamentLevel.SEMIS:
                return `SF-${this.series}-${this.matchNum}`;
            case TournamentLevel.FINALS:
                return `F-${this.matchNum}`;
        }
    }

    @OneToMany(() => MatchScores2021, (ms2021) => ms2021.match, {
        cascade: true,
    })
    @TypeormLoader()
    scores2021!: MatchScores2021[];

    @Field()
    @CreateDateColumn()
    createdAt!: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt!: Date;
}
