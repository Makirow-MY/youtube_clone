import { db } from "@/db";
import { users, videos, videosReactions, videosViews, videoUpdateSchema } from "@/db/schema";
import { z } from "zod";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, getTableColumns, exists } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { mux } from "@/lib/mux";
import { UploadThingError, UTApi } from "uploadthing/server";

export const videosReactionsRouter = createTRPCRouter({

    like: protectedProcedure
        .input(z.object({
            videoId: z.string()
        }))
        .mutation(async ({ ctx, input }) => {

            try {
                const { id: userId } = ctx.user;
                const { videoId } = input;

                if (!userId) {
                    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

                }

                if (!videoId) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Missing video Id, Try Signing In Again" });

                }


                const [exitingVideoReactions] = await db.select().from(videosReactions)
                    .where(and(
                        eq(videosReactions.userId, userId),
                        eq(videosReactions.videoId, videoId),
                        eq(videosReactions.type, "like")
                    ))

                if (exitingVideoReactions) {

                    const [deletedReaction] = await db.delete(videosReactions)
                        .where(and(
                            eq(videosReactions.userId, userId),
                            eq(videosReactions.videoId, videoId),
                            // eq(videosReactions.type, "like")
                        )).returning()

                    return deletedReaction;
                }

                const [newVideoReaction] = await db.insert(videosReactions).values({
                    userId,
                    videoId,
                    type: "like"
                })
                    .onConflictDoUpdate({
                        target: [videosReactions.userId, videosReactions.videoId],
                        set: {
                            type: "like",
                        }
                    })
                    .returning()


                return newVideoReaction;

            }
            catch (error) {
                throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `${error}` });
            }
        }),



    dislike: protectedProcedure
        .input(z.object({
            videoId: z.string()
        }))
        .mutation(async ({ ctx, input }) => {

            try {
                const { id: userId } = ctx.user;
                const { videoId } = input;

                if (!userId) {
                    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

                }

                if (!videoId) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Missing video Id, Try Signing In Again" });

                }


                const [exitingVideoReactions] = await db.select().from(videosReactions)
                    .where(and(
                        eq(videosReactions.userId, userId),
                        eq(videosReactions.videoId, videoId),
                        eq(videosReactions.type, "dislike")
                    ))

                if (exitingVideoReactions) {

                    const [deletedReaction] = await db.delete(videosReactions)
                        .where(and(
                            eq(videosReactions.userId, userId),
                            eq(videosReactions.videoId, videoId),
                            // eq(videosReactions.type, "like")
                        )).returning()

                    return deletedReaction;
                }

                const [newVideoReaction] = await db.insert(videosReactions).values({
                    userId,
                    videoId,
                    type: "dislike"
                })
                    .onConflictDoUpdate({
                        target: [videosReactions.userId, videosReactions.videoId],
                        set: {
                            type: "dislike",
                        }
                    })
                    .returning()


                return newVideoReaction;

            }
            catch (error) {
                throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `${error}` });
            }
        }),

});