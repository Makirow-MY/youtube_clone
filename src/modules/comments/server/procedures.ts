import { db } from "@/db";
import { commentInsertSchema, comments, commentsReactions, Subscriptions, users, videos, videosViews, videoUpdateSchema } from "@/db/schema";
import { z } from "zod";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, getTableColumns, exists, count, inArray, isNull, isNotNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { mux } from "@/lib/mux";
import { UploadThingError, UTApi } from "uploadthing/server";

export const commentsRouter = createTRPCRouter({

    create: protectedProcedure
        .input(z.object({
            videoId: z.string(),
            parentId: z.string().nullish(),
            content: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {

            try {
                const { id: userId } = ctx.user;
                const { videoId, parentId, content } = input;
               

                if (!userId) {
                    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

                }

                if (!videoId) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Missing video Id, Try Signing In Again" });

                }
const [existingComment] = await db.select().from(comments)
.where(inArray(comments.id, parentId ? [parentId] : []) )


                if (parentId && !existingComment) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Missing Parent Comment Id, Try Signing In Again" });

                }

                if(parentId && existingComment?.parentId) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: "Parent Comment Does Not Belong To The Same Video" });
                }

                const [newComments] = await db.insert(comments).values({
                    userId,
                    videoId,
                    parentId,
                    content,
                }).returning()


                return newComments;

            }
            catch (error) {
                throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `${error}` });
            }
        }),

        remove: protectedProcedure
        .input(z.object({
            commentId: z.string(),
           
        }))
        .mutation(async ({ ctx, input }) => {

            try {
                const { id: userId } = ctx.user;
                const { commentId} = input;
                //console.log(ctx.user)

                if (!userId) {
                    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

                }

                if (!commentId) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Missing video Id, Try Signing In Again" });

                }


                const [delComments] = await db.delete(comments)
                .where(
                    and(
                    eq(comments.userId, userId),
                    eq(comments.id, commentId)
                    )
                ).returning()

                 if (!delComments) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Missing video Id, Try Signing In Again" });

                }

                return delComments;

            }
            catch (error) {
                throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `${error}` });
            }
        }),

    getMany: baseProcedure
        .input(z.object({
            videoId: z.string(),
            parentId: z.string().nullish(),
            cursor: z.object({
                id: z.string(),
                updatedAt: z.date()
            }).nullish(),
            limit: z.number().min(1).max(100),

        }))
        .query(async ({ ctx, input }) => {
            try {
                const { videoId, cursor, limit, parentId } = input;
          const {clerkUserId} = ctx;

//console.log({ videoId, cursor, limit })

let userId;
              

                const[user] = await db.select().from(users).where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

                if(user) {
                    userId = user.id;
                }
               



                const [totalCount] = await db.select({
                    count: count(),
                }).from(comments)
                    .where(eq(comments.videoId, videoId))

                     const viewrReactions = db.$with("comment_reactions").as(
                                    db.select({
                                        commentId: commentsReactions.commentId,
                                        type: commentsReactions.type,
                                    }).from(commentsReactions)
                                        .where(inArray(commentsReactions.userId, userId ? [userId] : []))
                        );

                        const replies = db.$with("comment_replies").as(
                                    db.select({
                                        count: count(comments.id).as("replyCount"),
                                        parentId: comments.parentId,
                                    }).from(comments)
                                        .where(isNotNull(comments.parentId))
                                        .groupBy(comments.parentId)
                        );
                   
                const commentsList = await db.with(viewrReactions, replies)
                .select({
                    ...getTableColumns(comments),
                    user: users,
                   likeCount: db.$count(commentsReactions,
                        and(
                            eq(commentsReactions.commentId, comments.id),
                            eq(commentsReactions.type, "like")
                        )),
            
                         replyCount: replies.count,
                     
                    dislikeCount: db.$count(commentsReactions, and(
                        eq(commentsReactions.commentId, comments.id),
                        eq(commentsReactions.type, "dislike")
                    )),
                    viewerReaction: viewrReactions.type,
                }).from(comments)
                    .innerJoin(users, eq(users.id, comments.userId))
                    .leftJoin(viewrReactions, eq(viewrReactions.commentId, comments.id))
                     .leftJoin(replies, eq(replies.parentId, comments.id))
                    .where(
                        and(
                            eq(comments.videoId, videoId),
                           parentId ? eq(comments.parentId, parentId) : isNull(comments.parentId),
                            cursor ? or(
                                lt(comments.updatedAt, cursor.updatedAt),
                                and(
                                    eq(comments.updatedAt, cursor.updatedAt),
                                    lt(comments.id, cursor.id)
                                )

                            ) : undefined)
                    ).orderBy(desc(comments.updatedAt), desc(comments.id)).limit(limit + 1)

//console.log(commentsList, totalCount, viewrReactions)

                const hasMore = commentsList.length > limit;
                const items = hasMore ? commentsList.slice(0, -1) : commentsList;
                const lastComments = items[items.length - 1];
                const nextCursor = hasMore ? {
                    id: lastComments.id,
                    updatedAt: lastComments.updatedAt,
                } : null;



                return {
                    totalCount: totalCount.count ,
                    items,
                    nextCursor
                };
            } catch (error) {
                throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `${error}` });
            }
        }),
          getOne: baseProcedure
        .input(z.object({
            commentId: z.string(),
           
        }))
        .query(async ({ ctx, input }) => {
            try {
                const {commentId } = input;
          const {clerkUserId} = ctx;

//console.log({ videoId, cursor, limit })

let userId;
              

                const[user] = await db.select().from(users).where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

                if(user) {
                    userId = user.id;
                }
               


                     const viewrReactions = db.$with("comment_reactions").as(
                                    db.select({
                                        commentId: commentsReactions.commentId,
                                        type: commentsReactions.type,
                                    }).from(commentsReactions)
                                        .where(inArray(commentsReactions.userId, userId ? [userId] : []))
                        );

                        const replies = db.$with("comment_replies").as(
                                    db.select({
                                        count: count(comments.id).as("replyCount"),
                                        parentId: comments.parentId,
                                    }).from(comments)
                                        .where(isNotNull(comments.parentId))
                                        .groupBy(comments.parentId)
                        );
                   
                const [commentsList] = await db.with(viewrReactions, replies)
                .select({
                    ...getTableColumns(comments),
                    user: users,
                   likeCount: db.$count(commentsReactions,
                        and(
                            eq(commentsReactions.commentId, comments.id),
                            eq(commentsReactions.type, "like")
                        )),
            
                         replyCount: replies.count,
                     
                    dislikeCount: db.$count(commentsReactions, and(
                        eq(commentsReactions.commentId, comments.id),
                        eq(commentsReactions.type, "dislike")
                    )),
                    viewerReaction: viewrReactions.type,
                }).from(comments)
                    .innerJoin(users, eq(users.id, comments.userId))
                    .leftJoin(viewrReactions, eq(viewrReactions.commentId, comments.id))
                     .leftJoin(replies, eq(replies.parentId, comments.id))
                    .where(
                        and(
                          eq(comments.id, commentId)
                        )
                    )



                return commentsList;

            } catch (error) {
                throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `${error}` });
            }
        })
})
