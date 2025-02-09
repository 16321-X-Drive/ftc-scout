import { IntTy, nn } from "@ftc-scout/common";
import { GraphQLFieldConfig, GraphQLObjectType } from "graphql";
import { TeamGQL } from "./Team";
import { Team } from "../../db/entities/Team";
import { BestName } from "../../db/entities/BestName";
import { DATA_SOURCE } from "../../db/data-source";

function deleteOld() {
    DATA_SOURCE.createQueryBuilder()
        .delete()
        .from(BestName)
        .where("vote = -1")
        .andWhere("createdAt < NOW() - '1 day'::interval")
        .execute();
}

setTimeout(deleteOld, 1000 * 5);
setInterval(deleteOld, 1000 * 60 * 60 * 24); // Once a day.

export const BestNameGQL: GraphQLObjectType = new GraphQLObjectType<BestName>({
    name: "BestName",
    fields: () => ({
        id: IntTy,
        team1: {
            type: nn(TeamGQL),
            resolve: (bestName) => bestName.team1D,
        },
        team2: {
            type: nn(TeamGQL),
            resolve: (bestName) => bestName.team2D,
        },
    }),
});

export const BestNameQueries: Record<string, GraphQLFieldConfig<any, any>> = {
    getBestName: {
        type: BestNameGQL,
        resolve: async () => {
            let teams = await Team.createQueryBuilder("t").orderBy("RANDOM()").take(2).getMany();
            let bestName = BestName.create({
                team1: teams[0].number,
                team2: teams[1].number,
            });
            await bestName.save({ chunk: 100 });
            return {
                id: bestName.id,
                team1D: teams[0],
                team2D: teams[1],
            };
        },
    },
};

export const BestNameMutations: Record<string, GraphQLFieldConfig<any, any>> = {
    voteBestName: {
        type: BestNameGQL,
        args: {
            id: IntTy,
            vote: IntTy,
        },
        resolve: async (_, { id, vote }: { id: number; vote: number }) => {
            await DATA_SOURCE.createQueryBuilder()
                .update(BestName)
                .set({ vote })
                .where("id = :id AND (team1 = :vote OR team2 = :vote)", { id, vote })
                .execute();

            let teams = await Team.createQueryBuilder("t").orderBy("RANDOM()").take(2).getMany();
            let bestName = BestName.create({
                team1: teams[0].number,
                team2: teams[1].number,
            });
            await bestName.save({ chunk: 100 });
            return {
                id: bestName.id,
                team1D: teams[0],
                team2D: teams[1],
            };
        },
    },
};
