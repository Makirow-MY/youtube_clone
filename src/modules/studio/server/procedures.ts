import { db } from "@/db";
import { comments, users, videos, videosReactions, videosViews } from "@/db/schema";
import {z} from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, getTableColumns, inArray, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const studioRouter = createTRPCRouter({
      getOne: protectedProcedure.input(
        z.object({ id: z.string()     
    }))
    .query( async ({ctx, input}) => {

        const {id: userId} = ctx.user;
        const {id} = input

            if (!userId) {
                    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

                }

        const [video]  = await db.select().from(videos)
        .where(and(
            eq(videos.id, id),
            eq(videos.userId, userId)
        ));
             
        if (!video) {
             throw new TRPCError({code:"NOT_FOUND"})
        }

        return video;
    }),
    getMany: protectedProcedure
    .input(
        z.object({
           cursor: z.object({
            id: z.string(),
            updatedAt: z.date()
           }).nullish(),
           limit: z.number().min(1).max(100),
        }),
    )
    .query(async ({ctx, input}) => {
       
        const {cursor, limit } = input;
        const {id: userId} = ctx.user;
if (!userId) {
                    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

                }
                const viewerReactions = db.$with("viewer_reactions").as(
                        db.select({
                            videoId: videosReactions.videoId,
                            type: videosReactions.type,
                        }).from(videosReactions)
                            .where(inArray(videosReactions.userId, userId ? [userId] : []))
                    );

        const data = await db
        .with(viewerReactions)
        .select(
            {
                ...getTableColumns(videos),
                CommentCount: db.$count(comments, and(
                                        eq(comments.videoId, videos.id),
                                        
                                    )),
                viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
                                    likeCount: db.$count(videosReactions,
                                        and(
                                            eq(videosReactions.videoId, videos.id),
                                            eq(videosReactions.type, "like")
                                        )),
                                    dislikeCount: db.$count(videosReactions, and(
                                        eq(videosReactions.videoId, videos.id),
                                        eq(videosReactions.type, "dislike")
                                    )),
                                    viewerReaction: viewerReactions.type
            }
        ).from(videos)
        .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
            .where(and(
            eq(videos.userId, userId),
            cursor ? or(
                lt(videos.updatedAt, cursor.updatedAt),
                and(
                    eq(videos.updatedAt, cursor.updatedAt),
                    lt(videos.id, cursor.id)
                )
            ) : undefined,
        )).orderBy(desc(videos.updatedAt), desc(videos.id)).limit(limit + 1)


        const hasMore = data.length > limit;
        const items = hasMore ? data.slice(0, -1) : data;

        const lastData = items[items.length - 1];
        const nextCursor = hasMore ? {
            id: lastData.id,
            updatedAt: lastData.updatedAt,
        } : null;
        return {
            items,
           
            nextCursor,
        };
    })
})