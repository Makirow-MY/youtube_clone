import { db } from "@/db";
import { comments, playLists, playListsVideos, users, videos, videosReactions, videosViews } from "@/db/schema";
import { z } from "zod";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, getTableColumns, inArray, count, ilike, sql, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const searchRouter = createTRPCRouter({

    getMany: baseProcedure
        .input(
            z.object({
                query: z.string().nullish(),
                categoryId: z.string().nullish(),
                cursor: z.object({
                    id: z.string(),
                    updatedAt: z.date()
                }).nullish(),
                limit: z.number().min(1).max(100),
            }),
        )
        .query(async ({ ctx, input }) => {

            const { cursor, limit, query, categoryId } = input;

           // console.log({ query })

            if (!query?.trim()) {
                const data = await db
                    .select({
                        ...getTableColumns(videos),
                        user: users,
                        viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
                        likeCount: db.$count(
                            videosReactions,
                            and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, "like"))
                        ),
                        dislikeCount: db.$count(
                            videosReactions,
                            and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, "dislike"))
                        ),
                    })
                    .from(videos)
                    .innerJoin(users, eq(videos.userId, users.id))
                    .where(eq(videos.videoVisibility, "public"))
                    .orderBy(desc(videos.updatedAt), desc(videos.id))
                    .limit(limit + 1);

                const hasMore = data.length > limit;
                return {
                    items: hasMore ? data.slice(0, -1) : data,
                    nextCursor: hasMore
                        ? { id: data[data.length - 2].id, updatedAt: data[data.length - 2].updatedAt }
                        : null,
                };
            }

            const searchTerm = query.trim();

            const data = await db
                .select({
                    ...getTableColumns(videos),
                    user: users,
                    viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
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
                .where(and(
                    // ilike(videos.title, `%${query}%`),
                    eq(videos.videoVisibility, "public"),
                    or(
                        ilike(videos.title, `%${searchTerm}%`),
                        ilike(videos.description, `%${searchTerm}%`)
                    ),
                    cursor ? or(
                        lt(videos.updatedAt, cursor.updatedAt),
                        and(
                            eq(videos.updatedAt, cursor.updatedAt),
                            lt(videos.id, cursor.id)
                        )
                    ) : undefined,
                ))
                .orderBy(
                    //desc(sql`relevance`),
                    desc(videos.updatedAt),
                    desc(videos.id)).limit(limit + 1)


            const hasMore = data.length > limit;
            const items = hasMore ? data.slice(0, -1).sort(() => Math.random() - 0.5) : data.sort(() => Math.random() - 0.5);

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

    suggestions: baseProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(1).max(10).default(8),
            })
        )
        .query(async ({ ctx, input }) => {
            const { query, limit } = input;

           // console.log({ query, limit })

            const searchTerm = `%${query.trim()}%`;

            const { clerkUserId } = ctx;

            let userId;


            const [user] = await db.select().from(users).where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

            if (user) {
                userId = user.id;
            }


            //   const results = await db
            //     .select({
            //      ...getTableColumns(videos),
            //       viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
            //     })
            //     .from(videos)
            //     .where(
            //       and(
            //         eq(videos.videoVisibility, "public"),            
            //     searchTerm ? ilike(videos.title, `%${query}%`) : undefined,   // fast prefix-style match
            //       )
            //     )
            //     .orderBy(
            //        asc(sql`RANDOM()`)
            //         )
            //     .limit(limit);


            const videoResults = await db
                .select({
                    id: videos.id,
                    title: videos.title,
                    thumbnailUrl: videos.thumbnailUrl,
                    type: sql<string>`'video'`,
                    extra: sql<string>`NULL`,
                    viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
                })
                .from(videos)
                .where(
                    and(
                        eq(videos.videoVisibility, "public"),
                        ilike(videos.title, searchTerm)
                    )
                )
                .orderBy(desc(videos.updatedAt))
                .limit(Math.floor(limit / 3));

            const channelResults = await db
                .select({
                    id: users.id,
                    title: users.name,
                    thumbnailUrl: users.imageUrl,
                    type: sql<string>`'channel'`,
                    extra: sql<string>`NULL`,
                    viewCount: sql<number>`0`,
                })
                .from(users)
                .where(ilike(users.name, searchTerm))
                .limit(Math.floor(limit / 3));

           // console.log(channelResults)

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

            const playlistResults = await db
                .select({
                    id: playLists.id,
                    title: playLists.name,
                    thumbnailUrl: latestVideoSub.thumbnailUrl,
                    type: sql<string>`'playlist'`,
                    extra: sql<string>`NULL`,
                    viewCount:  db.$count(playListsVideos, eq(playListsVideos.playListId, playLists.id)),
                })
                .from(playLists)
                .innerJoin(users, eq(playLists.userId, users.id))
                .leftJoinLateral(latestVideoSub, sql`true`)   // or eq(playLists.id, latestVideoSub.playlistId) — but true is common for lateral
                .where(
                    and(
                        userId ? eq(playLists.userId, userId) : undefined,
                        ilike(playLists.name, searchTerm)

                    )
                )
                .orderBy(desc(playLists.updatedAt), desc(playLists.id))
                .limit(Math.floor(limit / 3));



           // console.log({ playlistResults })
            const allResults = [
                ...videoResults,
                ...channelResults,
                ...playlistResults,
            ];

            // Shuffle lightly and limit final output
            allResults.sort(() => Math.random() - 0.5);
           // console.log(allResults)
            return allResults.slice(0, limit);
            // return results;
        }),

    // ─────────────────────────────────────────────────────────────
    // 2. FULL SEARCH (much smarter than before)
    // ─────────────────────────────────────────────────────────────
    getManyw: baseProcedure
        .input(
            z.object({
                query: z.string().nullish(),
                categoryId: z.string().nullish(),
                cursor: z
                    .object({
                        id: z.string(),
                        updatedAt: z.date(),
                    })
                    .nullish(),
                limit: z.number().min(1).max(100),
            })
        )
        .query(async ({ input }) => {
            const { query, categoryId, cursor, limit } = input;
            //console.log({ query, categoryId, cursor, limit })
            // If no search query, return recent public videos
            if (!query?.trim()) {
                const data = await db
                    .select({
                        ...getTableColumns(videos),
                        user: users,
                        viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
                        likeCount: db.$count(
                            videosReactions,
                            and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, "like"))
                        ),
                        dislikeCount: db.$count(
                            videosReactions,
                            and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, "dislike"))
                        ),
                    })
                    .from(videos)
                    .innerJoin(users, eq(videos.userId, users.id))
                    .where(eq(videos.videoVisibility, "public"))
                    .orderBy(desc(videos.updatedAt), desc(videos.id))
                    .limit(limit + 1);

                const hasMore = data.length > limit;
                return {
                    items: hasMore ? data.slice(0, -1) : data,
                    nextCursor: hasMore
                        ? { id: data[data.length - 2].id, updatedAt: data[data.length - 2].updatedAt }
                        : null,
                };
            }

            const searchTerm = query.trim();

            const data = await db
                .select({
                    ...getTableColumns(videos),
                    user: users,
                    viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
                    likeCount: db.$count(
                        videosReactions,
                        and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, "like"))
                    ),
                    dislikeCount: db.$count(
                        videosReactions,
                        and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, "dislike"))
                    ),
                    // Relevance score (higher = better match)
                    relevance: sql<number>`ts_rank(
            to_tsvector('english', videos.title || ' ' || videos.description),
            to_tsquery('english', ${searchTerm})
          )`,
                })
                .from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .where(
                    and(
                        eq(videos.videoVisibility, "public"),
                        // categoryId ? eq(videos.categoryId, categoryId) : undefined,
                        // sql`to_tsvector('english', videos.title || ' ' || videos.description) @@ to_tsquery('english', ${searchTerm})`,
                        // 
                        cursor
                            ? or(
                                lt(videos.updatedAt, cursor.updatedAt),
                                and(eq(videos.updatedAt, cursor.updatedAt), lt(videos.id, cursor.id))
                            )
                            : undefined
                    )
                )
                .orderBy(
                    desc(sql`relevance`),        // most relevant first
                    desc(videos.updatedAt),      // then most recent
                    desc(videos.id)
                )
                .limit(limit + 1);

            const hasMore = data.length > limit;
            const items = hasMore ? data.slice(0, -1) : data;

            const nextCursor = hasMore
                ? {
                    id: items[items.length - 1].id,
                    updatedAt: items[items.length - 1].updatedAt,
                }
                : null;

            return { items, nextCursor };
        }),
})