import { db } from "@/db";
import { playLists, playListsVideos, Subscriptions, users, videos, videosReactions, videosViews, videotype, videoUpdateSchema } from "@/db/schema";
import { z } from "zod";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, getTableColumns, inArray, isNotNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { mux } from "@/lib/mux";
import { UploadThingError, UTApi } from "uploadthing/server";

export const playListRouter = createTRPCRouter({
    removeFromHistory: protectedProcedure
        .input(z.object({ videoId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user;
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

            }
            await db.delete(videosViews)
                .where(and(
                    eq(videosViews.userId, userId),
                    eq(videosViews.videoId, input.videoId)
                ));
            return { success: true };
        }),
    getHistory: protectedProcedure
        .input(
            z.object({
                cursor: z.object({
                    id: z.string(),
                    viewedAt: z.date(),
                }).nullish(),
                 myUserId: z.string().nullish(),
                limit: z.number().min(1).max(100),
            }),
        )
        .query(async ({ ctx, input }) => {

            const { cursor, limit, myUserId } = input;
              const {id: myId} = ctx.user;
        let userId = myId;

if (!userId) {

    if(myUserId){

    const [user] = await db.select().from(users).where(eq(users.clerkId, myUserId))

    if (user) {
        userId = user.id
    }
    else{
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });
    }

    }
      
    else{
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });
    }
}
            const viewVideoViews = db.$with("Viewer_videos_Views",).
                as(
                    db.select({
                        videoId: videosViews.videoId,
                        viewedAt: videosViews.updatedAt,
                    }).from(videosViews)
                        .where(eq(videosViews.userId, userId))
                );

            const viewCountSub = db.$count(videosViews, eq(videosViews.videoId, videos.id));

            const data = await db
                .with(viewVideoViews)
                .select({
                    ...getTableColumns(videos),
                    user: users,
                    viewCount: viewCountSub,
                    viewedAt: viewVideoViews.viewedAt,
                    likeCount: db.$count(videosReactions, and(
                        eq(videosReactions.videoId, videos.id),
                        eq(videosReactions.type, "like")
                    )),
                    dislikeCount: db.$count(videosReactions, and(
                        eq(videosReactions.videoId, videos.id),
                        eq(videosReactions.type, "dislike")
                    )),


                }).from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .innerJoin(viewVideoViews, eq(videos.id, viewVideoViews.videoId))
                .where(and(
                    eq(videos.videoVisibility, "public"),
                    cursor ? or(
                        lt(viewVideoViews.viewedAt, cursor.viewedAt),
                        and(
                            eq(viewVideoViews.viewedAt, cursor.viewedAt),
                            lt(videos.id, cursor.id)
                        )
                    ) : undefined,
                )).orderBy(
                    // desc(sql`${viewCountSub} * 0.6 + (EXTRACT(EPOCH FROM (NOW() - ${viewVideoViews.viewedAt})) / 86400) * 0.4`),
                    desc(viewVideoViews.viewedAt), desc(videos.id)).limit(limit + 1)


            const hasMore = data.length > limit;
            const items = hasMore ? data.slice(0, -1) : data;

            const lastData = items[items.length - 1];
            const nextCursor = hasMore ? {
                id: lastData.id,
                viewedAt: lastData.viewedAt,
            } : null;
            return {
                items,
                nextCursor,
            };
        }),

    getLike: protectedProcedure
        .input(
            z.object({
                categoryId: z.string().nullish(),
                videoType: z.enum(["video", "short"]).nullish(),
                cursor: z.object({
                    id: z.string(),
                    likedAt: z.date(),
                }).nullish(),
                limit: z.number().min(1).max(100),
                 myUserId: z.string().nullish(),
            }),
        )
        .query(async ({ ctx, input }) => {

            const { cursor, limit, myUserId, videoType } = input;
                         const {id: myId} = ctx.user;
        let userId = myId;

if (!userId) {

    if(myUserId){

    const [user] = await db.select().from(users).where(eq(users.clerkId, myUserId))

    if (user) {
        userId = user.id
    }
    else{
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });
    }

    }
      
    else{
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });
    }
}

            const viewVideoReactions = db.$with("Viewer_videos_Views",).
                as(
                    db.select({
                        videoId: videosReactions.videoId,
                        likedAt: videosReactions.updatedAt,
                    }).from(videosReactions)
                        .where(and(
                            eq(videosReactions.userId, userId),
                            eq(videosReactions.type, "like")
                        ))
                );

            const viewCountSub = db.$count(videosViews, eq(videosViews.videoId, videos.id));

            const data = await db
                .with(viewVideoReactions)
                .select({
                    ...getTableColumns(videos),
                    user: users,
                    viewCount: viewCountSub,
                    likedAt: viewVideoReactions.likedAt,
                    likeCount: db.$count(videosReactions, and(
                        eq(videosReactions.videoId, videos.id),
                        eq(videosReactions.type, "like")
                    )),
                    dislikeCount: db.$count(videosReactions, and(
                        eq(videosReactions.videoId, videos.id),
                        eq(videosReactions.type, "dislike")
                    )),


                }).from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .innerJoin(viewVideoReactions, eq(videos.id, viewVideoReactions.videoId))
                .where(and(
                    eq(videos.videoVisibility, "public"),
                    (videoType === "video" || videoType === "short") ? eq(videos.videoType, videoType) : undefined,
                    cursor ? or(
                        lt(viewVideoReactions.likedAt, cursor.likedAt),
                        and(
                            eq(viewVideoReactions.likedAt, cursor.likedAt),
                            lt(videos.id, cursor.id)
                        )
                    ) : undefined,
                )).orderBy(
                    // desc(sql`${viewCountSub} * 0.6 + (EXTRACT(EPOCH FROM (NOW() - ${viewVideoViews.viewedAt})) / 86400) * 0.4`),
                    desc(viewVideoReactions.likedAt), desc(videos.id)).limit(limit + 1)

            const totalData = await db
                .with(viewVideoReactions)
                .select({
                    ...getTableColumns(videos),
                    user: users,
                    viewCount: viewCountSub,
                    videoCount: db.$count(videos, and(
                        eq(videos.userId, users.id),

                    )),
                    likedAt: viewVideoReactions.likedAt,
                    likeCount: db.$count(videosReactions, and(
                        eq(videosReactions.videoId, videos.id),
                        eq(videosReactions.type, "like")
                    )),
                    dislikeCount: db.$count(videosReactions, and(
                        eq(videosReactions.videoId, videos.id),
                        eq(videosReactions.type, "dislike")
                    )),


                }).from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .innerJoin(viewVideoReactions, eq(videos.id, viewVideoReactions.videoId))
                .where(and(
                    eq(videos.videoVisibility, "public"),
                    cursor ? or(
                        lt(viewVideoReactions.likedAt, cursor.likedAt),
                        and(
                            eq(viewVideoReactions.likedAt, cursor.likedAt),
                            lt(videos.id, cursor.id)
                        )
                    ) : undefined,
                )).orderBy(
                    // desc(sql`${viewCountSub} * 0.6 + (EXTRACT(EPOCH FROM (NOW() - ${viewVideoViews.viewedAt})) / 86400) * 0.4`),
                    desc(viewVideoReactions.likedAt), desc(videos.id)).limit(limit + 1)

            const hasMore = data.length > limit;
            const items = hasMore ? data.slice(0, -1) : data;

            const lastData = items[items.length - 1];
            const nextCursor = hasMore ? {
                id: lastData.id,
                likedAt: lastData.likedAt,
            } : null;
            return {
                items,
                latestLiked: totalData,
                nextCursor,
            };
        }),

    creat: protectedProcedure.input(z.object(
        {
            name: z.string().min(1),
            videoId: z.string(),
            type: z.string(),
             myUserId: z.string().nullish(),
        }
    )).mutation(async ({ input, ctx }) => {
            const { name, videoId, type, myUserId } = input;
                          const {id: myId} = ctx.user;
        let userId = myId;

if (!userId) {

    if(myUserId){

    const [user] = await db.select().from(users).where(eq(users.clerkId, myUserId))

    if (user) {
        userId = user.id
    }
    else{
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });
    }

    }
      
    else{
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });
    }
}

            const [createPlaylist] = await db.insert(playLists)
                .values({
                    userId,
                    name,
                    videoVisibility: type === "public" ? "public" : "private"
                })
                .returning()

            if (!createPlaylist) {
                throw new TRPCError({ code: "NOT_IMPLEMENTED" })
            }

            const [createPlaylistVideo] = await db.insert(playListsVideos)
                .values({
                    videoId: videoId,
                    playListId: createPlaylist.id,
                })
                .returning()

            if (!createPlaylistVideo) {
                throw new TRPCError({ code: "BAD_REQUEST" })
            }

            return createPlaylist

        }),

    addPlaylist: protectedProcedure.input(z.object(
        {
            videoId: z.string(),
            playListId: z.string().nullish(),
             myUserId: z.string().nullish(),
        }
    ))
        .mutation(async ({ input, ctx }) => {
            const { videoId, playListId, myUserId } = input;
              const {id: myId} = ctx.user;
        let userId = myId;

if (!userId) {

    if(myUserId){

    const [user] = await db.select().from(users).where(eq(users.clerkId, myUserId))

    if (user) {
        userId = user.id
    }
    else{
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });
    }

    }
      
    else{
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });
    }
}
            //console.log({ videoId, playListId })

            if (!playListId || !videoId) {
                throw new TRPCError({ code: "NOT_FOUND" });

            }


            const [exitingPlaylist] = await db.select().from(playLists)
                .where(and(
                    eq(playLists.userId, userId),
                    eq(playLists.id, playListId),
                ))

            if (!exitingPlaylist) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Playlist not found" })
            }

            const [exitingPlayListsVideos] = await db.select().from(playListsVideos)
                .where(and(
                    eq(playListsVideos.videoId, videoId),
                    eq(playListsVideos.playListId, playListId),
                ))

            if (exitingPlayListsVideos) {

                const [deletedReaction] = await db.delete(playListsVideos)
                    .where(and(
                        eq(playListsVideos.videoId, videoId),
                        eq(playListsVideos.playListId, playListId),
                    )).returning()
                if (!deletedReaction) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: "Failed to remove video from playlist, please try again." })
                }
                   
                const data =  await db.select().from(playListsVideos)
                .where(eq(playListsVideos.playListId, playListId),
                    )
               
                 if (data.length === 0) {
                    await db.delete(playLists)
                    .where(
                        and(eq(playLists.id, playListId),
                            eq(playLists.userId, userId),
                        )
                    )
                }

                return deletedReaction


            }


            const [createPlaylistVideo] = await db.insert(playListsVideos)
                .values({
                    videoId: videoId,
                    playListId: playListId,
                }).returning()

            if (!createPlaylistVideo) {
                throw new TRPCError({ code: "BAD_REQUEST" })
            }

            return createPlaylistVideo

        }),

    removePlaylist: protectedProcedure
        .input(z.object({ playlistId: z.string(),
             myUserId: z.string().nullish(),
         }))
        .mutation(async ({ ctx, input }) => {
            const { playlistId, myUserId } = input;
                         const {id: myId} = ctx.user;
        let userId = myId;

if (!userId) {

    if(myUserId){

    const [user] = await db.select().from(users).where(eq(users.clerkId, myUserId))

    if (user) {
        userId = user.id
    }
    else{
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });
    }

    }
      
    else{
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });
    }
}
            const [PlayList] = await db
                .select()
                .from(playLists)
                .where(
                    and(eq(playLists.id, playlistId),
                     eq(playLists.userId, userId),
                    )
                )

            if (!PlayList) {
                throw new TRPCError({ code: "NOT_FOUND" })
            }

            const [deletePlaylistVideos] = await db.delete(playListsVideos)
                .where(
                    and(eq(playListsVideos.playListId, playlistId),
                    )
                ).returning()

            if (!deletePlaylistVideos) {
                throw new TRPCError({ code: "NOT_IMPLEMENTED" })
            }

            const [deletePlaylist] = await db.delete(playLists)
                .where(
                    and(eq(playLists.id, playlistId),
                        eq(playLists.userId, userId),
                    )
                ).returning()

            if (!deletePlaylist) {
                throw new TRPCError({ code: "NOT_IMPLEMENTED" })
            }

            return deletePlaylist;
        }),
        
 removeVideoFromPlaylist: protectedProcedure
        .input(z.object({ playlistId: z.string(),
            videoId: z.string(),
             myUserId: z.string().nullish(),
         }))
        .mutation(async ({ ctx, input }) => {
            const { playlistId, videoId, myUserId } = input;
                       const {id: myId} = ctx.user;
        let userId = myId;

if (!userId) {

    if(myUserId){

    const [user] = await db.select().from(users).where(eq(users.clerkId, myUserId))

    if (user) {
        userId = user.id
    }
    else{
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });
    }

    }
      
    else{
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });
    }
}
            const [deletePlaylistVideos] = await db.delete(playListsVideos)
                .where(
                    and(eq(playListsVideos.playListId, playlistId),
                    eq(playListsVideos.videoId, videoId),
                    )
                ).returning()

            if (!deletePlaylistVideos) {
                throw new TRPCError({ code: "NOT_IMPLEMENTED" })
            }

            const data =  await db.select().from(playListsVideos)
                .where(
                    and(eq(playListsVideos.playListId, playlistId),
                    )
                )

                 if (data.length === 0) {
                    await db.delete(playLists)
                    .where(
                        and(eq(playLists.id, playlistId),
                            eq(playLists.userId, userId),
                        )
                    )
                }

            return deletePlaylistVideos;
        }),
    getOne: baseProcedure
    //protectedProcedure
        .input(
            z.object({
                playlistId: z.string().nullish(),
                cursor: z.object({
                    id: z.string(),
                    updatedAt: z.date(),
                }).nullish(),
                limit: z.number().min(1).max(100),
            }),
        )
        .query(async ({ ctx, input }) => {

            const { cursor, limit, playlistId } = input;
            //  const { id: userId } = ctx.user

            // if (!userId) {
            //     throw new TRPCError({ code: "UNAUTHORIZED" })
            // }
            if (!playlistId) {
                throw new TRPCError({ code: "NOT_FOUND" })
            }
             const { clerkUserId } = ctx;

            let userId;
               const [user] = await db.select().from(users).where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

            if (user) {
                userId = user.id;
            }
            const [PlayList] = await db
                .select()
                .from(playLists)
                .where(
                    and(
                        eq(playLists.id, playlistId),
                       userId ?  eq(playLists.userId, userId) : undefined,
                    )
                )

            if (!PlayList) {
                throw new TRPCError({ code: "NOT_FOUND" })
            }

            const conditions = [
                eq(videos.videoVisibility, 'public'),
                cursor
                    ? or(
                        lt(videos.updatedAt, cursor.updatedAt),
                        and(eq(videos.updatedAt, cursor.updatedAt), lt(videos.id, cursor.id)),
                    )
                    : undefined,
            ].filter(Boolean);

            const playlistAllVideos = db.$with("playList_Videos").
                as(
                    db.select({
                        videoId: playListsVideos.videoId,
                        playlistId: playListsVideos.playListId,
                    }).from(playListsVideos)
                        .where(
                            eq(playListsVideos.playListId, playlistId)
                        )
                );

            const data = await db
                .with(playlistAllVideos)
                .select({
                    ...getTableColumns(videos),
                    playlistId: playlistAllVideos.playlistId, 
                    user: users,
                    viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
                    likeCount: db.$count(
                        videosReactions,
                        and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'like')),
                    ),
                    dislikeCount: db.$count(
                        videosReactions,
                        and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'dislike')),
                    ),
                })
                .from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .leftJoin(playlistAllVideos, eq(videos.id, playlistAllVideos.videoId))
                .where(and(...conditions))
                .orderBy(desc(sql`RANDOM()`), desc(videos.updatedAt), desc(videos.id)) // ← FIXED: stable order for cursor pagination
                .limit(limit + 1);

            const hasMore = data.length > limit;
            const items = hasMore ? data.slice(0, -1) : data;

            const nextCursor = hasMore
                ? {
                    id: items[items.length - 1].id,
                    updatedAt: items[items.length - 1].updatedAt,
                }
                : null;

            return {
                items,
                PlayList,
                nextCursor,
            };
        }),



    getPlayList: baseProcedure
        .input(
            z.object({
                cursor: z
                    .object({
                        id: z.string(),
                        updatedAt: z.date(),
                    })
                    .nullish(),
                limit: z.number().min(1).max(100),
            })
        )
        .query(async ({ ctx, input }) => {
            const { cursor, limit } = input;
            const { clerkUserId } = ctx;

            let userId;


            const [user] = await db.select().from(users).where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

            if (user) {
                userId = user.id;
            }




            // Latest video per playlist (as a subquery)
            const latestVideoSub = db
                .select({
                    playlistId: playListsVideos.playListId,
                    thumbnailUrl: videos.thumbnailUrl,
                    title: videos.title,
                    videoId: videos.id,
                })
                .from(playListsVideos)
                .innerJoin(videos, eq(playListsVideos.videoId, videos.id))
                .where(eq(playListsVideos.playListId, playLists.id)) // correlated
                .orderBy(desc(playListsVideos.createdAt))
                .limit(1)
                .as("latest_video");

            const data = await db
                .select({
                    ...getTableColumns(playLists),
                    videoCount: db.$count(playListsVideos, eq(playListsVideos.playListId, playLists.id)),
                    user: users,
                    thumbnailUrl: latestVideoSub.thumbnailUrl,
                    latestVideoTitle: latestVideoSub.title,
                    videoId: latestVideoSub.videoId,
                })
                .from(playLists)
                .innerJoin(users, eq(playLists.userId, users.id))
                .leftJoinLateral(latestVideoSub, sql`true`)   // or eq(playLists.id, latestVideoSub.playlistId) — but true is common for lateral
                .where(
                    and(
                        userId ? eq(playLists.userId, userId) : undefined,
                        cursor
                            ? or(
                                lt(playLists.updatedAt, cursor.updatedAt),
                                and(
                                    eq(playLists.updatedAt, cursor.updatedAt),
                                    lt(playLists.id, cursor.id)
                                )
                            )
                            : undefined
                    )
                )
                .orderBy(desc(playLists.updatedAt), desc(playLists.id))
                .limit(limit + 1);

            const hasMore = data.length > limit;
            const items = hasMore ? data.slice(0, -1) : data;

            const nextCursor = hasMore
                ? {
                    id: items[items.length - 1].id,
                    updatedAt: items[items.length - 1].updatedAt,
                }
                : null;

            return {
                items,
                nextCursor,

            };
        }),
});