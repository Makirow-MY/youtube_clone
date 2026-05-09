import { db } from "@/db";
import { commentsReactions, users, videos, videosReactions, videosViews, videoUpdateSchema } from "@/db/schema";
import { z } from "zod";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, getTableColumns, exists } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { mux } from "@/lib/mux";
import { UploadThingError, UTApi } from "uploadthing/server";

export const commentReactionsRouter = createTRPCRouter({

    like: protectedProcedure
        .input(z.object({
            commentId: z.string()
        }))
        .mutation(async ({ ctx, input }) => {

            try {
                const { id: userId } = ctx.user;
                const { commentId } = input;

                if (!userId) {
                    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

                }

                if (!commentId) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Missing comment Id, Try Signing In Again" });

                }


                const [exitingCommentReactions] = await db.select().from(commentsReactions)
                    .where(and(
                        eq(commentsReactions.userId, userId),
                        eq(commentsReactions.commentId, commentId),
                        eq(commentsReactions.type, "like")
                    ))

                if (exitingCommentReactions) {

                    const [deletedReaction] = await db.delete(commentsReactions)
                        .where(and(
                            eq(commentsReactions.userId, userId),
                            eq(commentsReactions.commentId, commentId),
                            // eq(commentsReactions.type, "like")
                        )).returning()

                    return deletedReaction;
                }

                const [newCommentReaction] = await db.insert(commentsReactions).values({
                    userId,
                    commentId,
                    type: "like"
                })
                    .onConflictDoUpdate({
                        target: [commentsReactions.userId, commentsReactions.commentId],
                        set: {
                            type: "like",
                        }
                    })
                    .returning()


                return newCommentReaction;

            }
            catch (error) {
                throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `${error}` });
            }
        }),



    dislike: protectedProcedure
        .input(z.object({
            commentId: z.string()
        }))
        .mutation(async ({ ctx, input }) => {

            try {
                const { id: userId } = ctx.user;
                const { commentId } = input;

                if (!userId) {
                    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

                }

                if (!commentId) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Missing comment Id, Try Signing In Again" });

                }


                const [exitingCommentReactions] = await db.select().from(commentsReactions)
                    .where(and(
                        eq(commentsReactions.userId, userId),
                        eq(commentsReactions.commentId, commentId),
                        eq(commentsReactions.type, "dislike")
                    ))

                if (exitingCommentReactions) {

                    const [deletedReaction] = await db.delete(commentsReactions)
                        .where(and(
                            eq(commentsReactions.userId, userId),
                            eq(commentsReactions.commentId, commentId),
                            // eq(commentsReactions.type, "like")
                        )).returning()

                    return deletedReaction;
                }

                const [newCommentReaction] = await db.insert(commentsReactions).values({
                    userId,
                    commentId,
                    type: "dislike"
                })
                    .onConflictDoUpdate({
                        target: [commentsReactions.userId, commentsReactions.commentId],
                        set: {
                            type: "dislike",
                        }
                    })
                    .returning()


                return newCommentReaction;

            }
            catch (error) {
                throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `${error}` });
            }
        }),

});