import { db } from "@/db";
import { comments, Subscriptions, users, videos, videosReactions, videosViews } from "@/db/schema";
import {z} from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, getTableColumns, inArray, count, sql, asc } from "drizzle-orm";
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
    }),
    // Add these inside your videosRouter
getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
  const { id: userId } = ctx.user;

  const [stats] = await db
    .select({
      totalVideos: sql<number>`count(*)`,
    totalViews: sql<number>`(select count(*) from ${videosViews} where ${videosViews.videoId} in (
        select ${videos.id} from ${videos} where ${videos.userId} = ${userId}
      ))`,
      totalLikes: sql<number>`(
        select count(*) from ${videosReactions} 
        where ${videosReactions.videoId} in (
          select ${videos.id} from ${videos} where ${videos.userId} = ${userId}
        ) 
        and ${videosReactions.type} = 'like'
      )`,
      totalSubscribers: sql<number>`(select count(*) from ${Subscriptions} where ${Subscriptions.creatorId} = ${userId})`,
    })
    .from(videos)
    .leftJoin(videosViews, eq(videosViews.videoId, videos.id))
    .leftJoin(videosReactions, eq(videosReactions.videoId, videos.id))
    .where(eq(videos.userId, userId));

  return stats;
}),

getWeeklyAnalytics: protectedProcedure.query(async ({ ctx }) => {
  const { id: userId } = ctx.user;

  const data = await db
    .select({
      week: sql<string>`to_char(${videos.createdAt}, 'Mon DD')`,
      views: sql<number>`count(${videosViews.id})`,
      likes: sql<number>`count(case when ${videosReactions.type} = 'like' then 1 end)`,
    })
    .from(videos)
    .leftJoin(videosViews, eq(videosViews.videoId, videos.id))
    .leftJoin(videosReactions, eq(videosReactions.videoId, videos.id))
    .where(eq(videos.userId, userId))
    .groupBy(sql`to_char(${videos.createdAt}, 'Mon DD'), ${videos.createdAt}`)
    .orderBy(asc(videos.createdAt))
    .limit(8);

  return data;
}),

getTopVideos: protectedProcedure.query(async ({ ctx }) => {
  const { id: userId } = ctx.user;

  return await db
    .select({
      id: videos.id,
      title: videos.title,
      views: sql<number>`count(${videosViews.id})`,
      likes: sql<number>`count(case when ${videosReactions.type} = 'like' then 1 end)`,
      thumbnailUrl: videos.thumbnailUrl,
    })
    .from(videos)
    .leftJoin(videosViews, eq(videosViews.videoId, videos.id))
    .leftJoin(videosReactions, eq(videosReactions.videoId, videos.id))
    .where(eq(videos.userId, userId))
    .groupBy(videos.id)
    .orderBy(desc(sql`count(${videosViews.id})`))
    .limit(5);
}),

// Recent Uploads
getRecentUploads: protectedProcedure
  .input(z.object({ limit: z.number().default(6) }))
  .query(async ({ ctx, input }) => {
    const { id: userId } = ctx.user;

    const data =  await db
      .select({
        id: videos.id,
        title: videos.title,
        thumbnailUrl: videos.thumbnailUrl,
        videoType: videos.videoType,
        createdAt: videos.createdAt,
        viewCount: sql<number>`count(${videosViews.id})`,
        likeCount: sql<number>`count(case when ${videosReactions.type} = 'like' then 1 end)`,
      })
      .from(videos)
      .leftJoin(videosViews, eq(videosViews.videoId, videos.id))
      .leftJoin(videosReactions, eq(videosReactions.videoId, videos.id))
      .where(eq(videos.userId, userId))
      .groupBy(videos.id)
      .orderBy(desc(videos.createdAt))
      .limit(input.limit);

console.log(data)
      return data;
  }),

// Recent Comments
getRecentComments: protectedProcedure
  .input(z.object({ limit: z.number().default(5) }))
  .query(async ({ ctx, input }) => {
    const { id: userId } = ctx.user;

    return await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        video: {
          id: videos.id,
          title: videos.title,
        },
        user: {
          name: users.name,
          imageUrl: users.imageUrl,
          clerkId: users.clerkId,
        },
      })
      .from(comments)
      .innerJoin(videos, eq(comments.videoId, videos.id))
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(videos.userId, userId))
      .orderBy(desc(comments.createdAt))
      .limit(input.limit);
  }),

// Recent Subscribers
getRecentSubscribers: protectedProcedure
  .input(z.object({ limit: z.number().default(5) }))
  .query(async ({ ctx, input }) => {
    const { id: userId } = ctx.user;

    return await db
      .select({
        id: users.id,
        name: users.name,
        imageUrl: users.imageUrl,
        clerkId: users.clerkId,
        subscribedAt: Subscriptions.createdAt,
      })
      .from(Subscriptions)
      .innerJoin(users, eq(Subscriptions.viewerId, users.id))
      .where(eq(Subscriptions.creatorId, userId))
      .orderBy(desc(Subscriptions.createdAt))
      .limit(input.limit);
  }),

})