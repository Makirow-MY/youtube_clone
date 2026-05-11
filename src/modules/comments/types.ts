
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

export type VideoGetManyOutput = inferRouterOutputs<AppRouter>["comments"]["getMany"]

export type UserGetOneOutput = inferRouterOutputs<AppRouter>["users"]["getOne"]