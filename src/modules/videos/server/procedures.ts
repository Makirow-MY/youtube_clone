import { db } from "@/db";
import { Subscriptions, users, videos, videosReactions, videosViews, videoTags, videoTopics, videoUpdateSchema } from "@/db/schema";
import { z } from "zod";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, getTableColumns, inArray, isNotNull, sql, asc, ilike } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { mux } from "@/lib/mux";
import { UploadThingError, UTApi } from "uploadthing/server";
import { AudienceAnalysisService, VideoTaggingService } from "@/lib/ai-tagging";

export const videosRouter = createTRPCRouter({
    reValidate: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const { id: userId } = ctx.user
                const [ExistingVideo] = await db.select().from(videos)
                    .where(and(
                        eq(videos.id, input.id),
                        eq(videos.userId, userId),
                    ))

                if (!ExistingVideo) {
                    throw new TRPCError({ code: "NOT_FOUND" })
                }

                if (!ExistingVideo.muxUploadId) {
                    throw new TRPCError({ code: "BAD_REQUEST" })
                }

                const directUpload = await mux.video.uploads.retrieve(
                    ExistingVideo.muxUploadId
                )

                if (!directUpload || !directUpload.asset_id) {
                    throw new TRPCError({ code: "BAD_REQUEST" })
                }

                const assets = await mux.video.assets.retrieve(
                    directUpload.asset_id
                )
                if (!assets) {
                    throw new TRPCError({ code: "BAD_REQUEST" })
                }
                const duration = assets.duration ? Math.round(assets.duration * 1000) : 0

                await db.update(videos).set({
                    muxPlaybakId: null,
                    muxAssetId: null,
                    duration
                }).where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId),
                ))

                
             if(!ExistingVideo.previewKey || !ExistingVideo.thumbnailKey){

                
                if (ExistingVideo.thumbnailKey) {
                    const utapi = new UTApi();

                    await utapi.deleteFiles(ExistingVideo.thumbnailKey);
                    await db.update(videos).set({
                        thumbnailUrl: null,
                        thumbnailKey: null,
                    }).where(and(
                        eq(videos.id, input.id),
                        eq(videos.userId, userId),
                    ))
                }
                  if (ExistingVideo.previewKey) {
                    const utapi = new UTApi();

                    await utapi.deleteFiles(ExistingVideo.previewKey);
                    await db.update(videos).set({
                        previewUrl: null,
                        previewKey: null,
                    }).where(and(
                        eq(videos.id, input.id),
                        eq(videos.userId, userId),
                    ))
                }

                const tempThumbnailUrl = `https://image.mux.com/${assets.playback_ids?.[0]?.id}/thumbnail.jpg`
                const tempPreviewUrl = `https://image.mux.com/${assets.playback_ids?.[0]?.id}/animated.gif`

                const utapi = new UTApi()
                const UPthumbnailUrl = await utapi.uploadFilesFromUrl(tempThumbnailUrl)
                const UPpreviewUrl = await utapi.uploadFilesFromUrl(tempPreviewUrl)

                if (!UPthumbnailUrl.data) {
                    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
                }
                 if (!UPpreviewUrl.data) {
                    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
                 }

                const { key: thumbnailKey, ufsUrl: thumbnailUrl } = UPthumbnailUrl.data

               const {key: previewKey, ufsUrl: previewUrl } = UPpreviewUrl.data

                     await db.update(videos).set({ 
                    thumbnailUrl: thumbnailUrl ?? tempThumbnailUrl, 
                    thumbnailKey, 
                    previewUrl: previewUrl ?? tempPreviewUrl, 
                    previewKey })
                    .where(and(
                        eq(videos.id, input.id),
                        eq(videos.userId, userId),
                    )).returning();

                }


                const [updateVid] = await db.update(videos).set({
                    muxStatus: assets.status,
                    muxPlaybakId: assets.playback_ids?.[0]?.id,
                    muxAssetId: assets.id,
                    duration
                }).where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId),
                )).returning()

                return updateVid

            } catch (error) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
            }

        }),
    restoreThumbnail: protectedProcedure
        .input(z.object({
            id: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            try {
                const { id: userId } = ctx.user
                if (!userId) {
                    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

                }
                const [ExistingVideo] = await db.select().from(videos)
                    .where(and(
                        eq(videos.id, input.id),
                        eq(videos.userId, userId),
                    ))

                if (!ExistingVideo) {
                    throw new TRPCError({ code: "NOT_FOUND" })
                }

                if (ExistingVideo.thumbnailKey) {
                    const utapi = new UTApi();

                    await utapi.deleteFiles(ExistingVideo.thumbnailKey);
                    await db.update(videos).set({
                        thumbnailUrl: null,
                        thumbnailKey: null,
                    }).where(and(
                        eq(videos.id, input.id),
                        eq(videos.userId, userId),
                    ))
                }
                  if (ExistingVideo.previewKey) {
                    const utapi = new UTApi();

                    await utapi.deleteFiles(ExistingVideo.previewKey);
                    await db.update(videos).set({
                        previewUrl: null,
                        previewKey: null,
                    }).where(and(
                        eq(videos.id, input.id),
                        eq(videos.userId, userId),
                    ))
                }

                if (!ExistingVideo.muxPlaybakId) {
                    throw new TRPCError({ code: "BAD_REQUEST" })
                }

                const tempThumbnailUrl = `https://image.mux.com/${ExistingVideo.muxPlaybakId}/thumbnail.jpg`
                const tempPreviewUrl = `https://image.mux.com/${ExistingVideo.muxPlaybakId}/animated.gif`

                const utapi = new UTApi()
                const UPthumbnailUrl = await utapi.uploadFilesFromUrl(tempThumbnailUrl)
                const UPpreviewUrl = await utapi.uploadFilesFromUrl(tempPreviewUrl)

                if (!UPthumbnailUrl.data) {
                    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
                }
                 if (!UPpreviewUrl.data) {
                    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
                 }

                const { key: thumbnailKey, ufsUrl: thumbnailUrl } = UPthumbnailUrl.data

               const {key: previewKey, ufsUrl: previewUrl } = UPpreviewUrl.data

                const [UpdateVideo] = await db.update(videos).set({ 
                    thumbnailUrl: thumbnailUrl ?? tempThumbnailUrl, 
                    thumbnailKey, 
                    previewUrl: previewUrl ?? tempPreviewUrl, 
                    previewKey })
                    .where(and(
                        eq(videos.id, input.id),
                        eq(videos.userId, userId),
                    )).returning();

                return UpdateVideo;
            } catch (error) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
            }

        }),
    remove: protectedProcedure.input(z.object({
        id: z.string()
    })).mutation(async ({ ctx, input }) => {
        try {
            const { id: userId } = ctx.user
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

            }
            const [removeVideo] = await db.delete(videos)
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId),
                )).returning()

            if (!removeVideo) {
                throw new TRPCError({ code: "NOT_FOUND" })
            }

            return removeVideo;
        } catch (error) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
        }

    })
    ,
    autoTagVideo: protectedProcedure
        .input(z.object({ videoId: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const { videoId } = input;
            const { id: userId } = ctx.user
            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

            }

            // Get video metadata
            const [video] = await db.select().from(videos)
                .where(and(
                    eq(videos.id, videoId),
                    eq(videos.userId, userId),
                ))


            if (!video) throw new TRPCError({ code: "NOT_FOUND" });

            const taggingService = new VideoTaggingService();
            const { tags, topics } = await taggingService.extractTagsFromMetadata(
                video.title,
                video.description || ""
            );

            const MyTopic = topics.slice(0, 4)
            const MyTag = tags.slice(0, 4)
            // Save tags and topics
            await taggingService.saveTags(videoId, MyTag);
            await taggingService.saveTopics(videoId, MyTopic);
            return {
                success: true,
                tagsCount: tags.length,
                topicsCount: topics.length,
                tags: MyTag,
                topics: MyTopic
            };

        }),
    update: protectedProcedure.input(videoUpdateSchema).mutation(
        async ({ ctx, input }) => {
            try {
                const { id: userId } = ctx.user;
                if (!userId) {
                    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

                }

                if (!input.id) {
                    throw new TRPCError({ code: "BAD_REQUEST" })
                }

                const [updateVideo] = await db.update(videos)
                    .set({
                        title: input.title,
                        description: input.description,
                        videoVisibility: input.videoVisibility,
                        updatedAt: new Date()
                    }).where(and(
                        eq(videos.id, input.id),
                        eq(videos.userId, userId)
                    )).returning()



                if (!updateVideo) { throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Failed To Create Video" }); }
                const taggingService = new VideoTaggingService();
                const { tags, topics } = await taggingService.extractTagsFromMetadata(
                    updateVideo.title,
                    updateVideo.description || ""
                );
                await taggingService.saveTags(updateVideo.id, tags);
                await taggingService.saveTopics(updateVideo.id, topics);
                const audienceService = new AudienceAnalysisService();
                await audienceService.updateVideoAudiences({ videoId: updateVideo.id, video: updateVideo });



                return {
                    video: {
                        ...updateVideo,
                        tags: tags.slice(0, 5),
                        topics: topics.slice(0, 3),
                    },
                    type: input.videoType,
                    tagsGenerated: tags.length,
                    topicsGenerated: topics.length,
                };

            }
            catch (error) {
                console.error("Error updating video:", error);
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `${error}` })
            }
        }
    )
    ,
    create: protectedProcedure.mutation(async ({ ctx }) => {

        try {
            const { id: userId } = ctx.user;
            // // console.log(ctx.user)

            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

            }


            const upload = await mux.video.uploads.create({
                new_asset_settings: {
                    passthrough: userId,
                    playback_policies: ["public"],
                    master_access: "temporary",
                    inputs: [
                        {
                            generated_subtitles: [
                                {
                                    language_code: "en",
                                    name: "English",
                                }]
                        }
                    ]
                },
                cors_origin: "*",
            })

            if (!upload.id) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Failed to upload vidieo" });
            }

            const [video] = await db.insert(videos).values({
                userId,
                title: "Untitled Video",
                muxStatus: "waiting",
                muxUploadId: upload.id,
                videoType: "video",
            }).returning();

            if (!video) {
                throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Failed To Publish Video" });

            }
            const taggingService = new VideoTaggingService();
            const { tags, topics } = await taggingService.extractTagsFromMetadata(
                video.title,
                video.description || ""
            );

            await taggingService.saveTags(video.id, tags);
            await taggingService.saveTopics(video.id, topics);

            return {
                video: {
                    ...video,
                    tags: tags.slice(0, 5),
                    topics: topics.slice(0, 3),
                },
                url: upload.url,
                tagsGenerated: tags.length,
                topicsGenerated: topics.length,
                type: "video"
            };
        }
        catch (error) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `${error}` });
        }
    }),
    createShort: protectedProcedure.mutation(async ({ ctx }) => {
        const { id: userId } = ctx.user;

        if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Optimized for Shorts (vertical)
        const upload = await mux.video.uploads.create({
            new_asset_settings: {
                passthrough: `short_${userId}`,
                playback_policies: ["public"],
                master_access: "temporary",
                inputs: [
                    {
                        generated_subtitles: [
                            {
                                language_code: "en",
                                name: "English",
                            }]
                    }
                ],
            },
            cors_origin: "*",
        });

        const [short] = await db.insert(videos).values({
            userId,
            title: "Untitled Short",
            muxStatus: "waiting",
            muxUploadId: upload.id,
            videoType: "short",               // ← This is what makes it a Short
        }).returning();
        const taggingService = new VideoTaggingService();

        const { tags, topics } = await taggingService.extractTagsFromMetadata(
            short.title,
            short.description || ""
        );

        await taggingService.saveTags(short.id, tags);
        await taggingService.saveTopics(short.id, topics);
        return {
            video: short,
            url: upload.url,
            tagsGenerated: tags.length,
            topicsGenerated: topics.length,
            type: "short"
        };
    }),
    getOne: baseProcedure.input(z.object({
        id: z.string().nullish(),
        videoType: z.enum(["video", "short"]).default("video").optional(),
    })).query(
        async ({ input, ctx }) => {
            const clerkUserId = ctx.clerkUserId;
            const videoId = input.id;
            const videoType = input.videoType;

            let userId;
      
            if (!videoId) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Video ID is required" });

            }


            const [user] = await db.select().from(users).where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

            if (user) {
                userId = user.id;
            }

            const viewerReactions = db.$with("viewer_reactions").as(
                db.select({
                    videoId: videosReactions.videoId,
                    type: videosReactions.type,
                }).from(videosReactions)
                    .where(inArray(videosReactions.userId, userId ? [userId] : []))
            );

            const viewerSubscription =
                db.$with("viewer_subscription").as(
                    db.select().from(Subscriptions)
                        .where(inArray(Subscriptions.viewerId, userId ? [userId] : []))
                );

            const viewCountSub = db.$count(videosViews, eq(videosViews.videoId, videos.id));

            const [existingVid] = await db
                .with(viewerReactions, viewerSubscription)
                .select({
                    ...getTableColumns(videos),
                    user: {
                        ...getTableColumns(users),
                        subscriberCount: db.$count(Subscriptions, eq(Subscriptions.creatorId, users.id)),
                        viewerSubscribed: isNotNull(viewerSubscription.viewerId).mapWith(Boolean)
                    },
                    playlistId: sql<string>`NULL`,
                    viewCount: viewCountSub,
                    likeCount: db.$count(videosReactions,
                        and(
                            eq(videosReactions.videoId, videos.id),
                            eq(videosReactions.type, "like")
                        )),
                    dislikeCount: db.$count(videosReactions, and(
                        eq(videosReactions.videoId, videos.id),
                        eq(videosReactions.type, "dislike")
                    )),
                    viewerReaction: viewerReactions.type,


                }).from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
                .leftJoin(viewerSubscription, eq(viewerSubscription.creatorId, users.id))
                .where(and(
                   eq(videos.id, videoId),
                 ))

            if (!existingVid) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Existing video not found" });

            }
            return existingVid;

        }
    ),

    getMany: baseProcedure
        .input(
            z.object({
                categoryId: z.string().nullish(),
                myUserId: z.string().nullish(),
                cursor: z
                    .object({
                        id: z.string(),
                        updatedAt: z.date(),
                        score: z.number().optional(),
                    })
                    .nullish(),
                limit: z.number().min(1).max(100),
            }),
        )
        .query(async ({ ctx, input }) => {
            const { cursor, limit, categoryId, myUserId } = input;
            const clerkUserId = ctx.clerkUserId ?? myUserId;
            let userId;

            // Get user ID if logged in
            const [user] = await db.select().from(users).where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))
            if (user) {
                userId = user.id;
            }

            let userVideoTopic;
            if (categoryId) {
                const [topicId] = await db
                    .select()
                    .from(videoTopics)
                    .where(
                        eq(videoTopics.id, categoryId)
                    )

                const topicTiles = await db
                    .select()
                    .from(videoTopics)
                    .where(
                        topicId ? eq(videoTopics.topicName, topicId.topicName) : undefined
                    )

                userVideoTopic = topicTiles.map(t => t.topicName);
            }




            const viewerReactions = db.$with("viewer_reactions").as(
                db.select({
                    videoId: videosReactions.videoId,
                    type: videosReactions.type,
                }).from(videosReactions)
                    .where(inArray(videosReactions.userId, userId ? [userId] : []))
            );

            const viewerSubscription = db.$with("viewer_subscription").as(
                db.select().from(Subscriptions)
                    .where(inArray(Subscriptions.viewerId, userId ? [userId] : []))
            );
            const topic = userVideoTopic && userVideoTopic.length > 0 ? `${userVideoTopic[0]?.split("")[0]}${userVideoTopic[0]?.split("")[1]}` : undefined;
           
            const sourceTags = await db.select().from(videoTags).where(
                ilike(videoTags.tagName, `%${topic}%`),

            );

            let data;

            if (categoryId && userVideoTopic && userVideoTopic.length > 0) {
                const retrivedData = await db
                    .with(viewerReactions, viewerSubscription)
                    .select({
                        ...getTableColumns(videos),
                        user: {
                            ...getTableColumns(users),
                            subscriberCount: db.$count(Subscriptions, eq(Subscriptions.creatorId, users.id)),
                            viewerSubscribed: isNotNull(viewerSubscription.viewerId).mapWith(Boolean)
                        },
                        // videoTopic: {
                        //     ...getTableColumns(videoTopics),
                        // },
                        // videoTag: {
                        //     ...getTableColumns(videoTags),
                        // },
                        playlistId: sql<string>`NULL`,
                        viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
                        likeCount: db.$count(
                            videosReactions,
                            and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'like')),
                        ),
                        dislikeCount: db.$count(
                            videosReactions,
                            and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'dislike')),
                        ),
                        viewerReaction: viewerReactions.type,
                    })
                    .from(videos)
                    .innerJoin(users, eq(videos.userId, users.id))
                    .innerJoin(videoTopics, eq(videoTopics.videoId, videos.id))
                    //.innerJoin(videoTags, eq(videoTags.videoId, videos.id))
                    .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
                    .leftJoin(viewerSubscription, eq(viewerSubscription.creatorId, users.id))
                    .where(and(
                        eq(videos.videoVisibility, 'public'),
                        eq(videoTopics.topicName, userVideoTopic[0]),
                        cursor ? or(
                            lt(videos.updatedAt, cursor.updatedAt),
                            and(
                                eq(videos.updatedAt, cursor.updatedAt),
                                lt(videos.id, cursor.id)
                            ),
                        ) : undefined,

                    ))
                    .orderBy(desc(sql`RANDOM()`), desc(videos.updatedAt), desc(videos.id))
                    .limit(limit + 1);

                data = retrivedData;

            }

            else {
// console.log({ topic, clerkUserId, userId , userVideoTopic})

                const retrivedData = await db
                    .with(viewerReactions, viewerSubscription)
                    .select({
                        ...getTableColumns(videos),
                        user: {
                            ...getTableColumns(users),
                            subscriberCount: db.$count(Subscriptions, eq(Subscriptions.creatorId, users.id)),
                            viewerSubscribed: isNotNull(viewerSubscription.viewerId).mapWith(Boolean)
                        },
                        // videoTopic: {
                        //     ...getTableColumns(videoTopics),
                        // },
                        // videoTag: {
                        //     ...getTableColumns(videoTags),
                        // },
                        playlistId: sql<string>`NULL`,
                        viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
                        likeCount: db.$count(
                            videosReactions,
                            and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'like')),
                        ),
                        dislikeCount: db.$count(
                            videosReactions,
                            and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'dislike')),
                        ),
                        viewerReaction: viewerReactions.type,
                    })
                    .from(videos)
                    .innerJoin(users, eq(videos.userId, users.id))
                    .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
                    .leftJoin(viewerSubscription, eq(viewerSubscription.creatorId, users.id))
                    .where(and(
                        eq(videos.videoVisibility, 'public'),
                        cursor ? or(
                            lt(videos.updatedAt, cursor.updatedAt),
                            and(
                                eq(videos.updatedAt, cursor.updatedAt),
                                lt(videos.id, cursor.id)
                            ),
                        ) : undefined,

                    ))
                    .orderBy(desc(sql`RANDOM()`), desc(videos.updatedAt), desc(videos.id))
                    .limit(limit + 1);
                data = retrivedData;
console.log(retrivedData, "trteieve")
            }
           
            const hasMore = data && (data.length > limit);
            const items = hasMore ? data?.sort(() => Math.random() - 0.5).slice(0, -1) : data ? data.sort(() => Math.random() - 0.5) : [];

            const nextCursor = hasMore && items
                ? {
                    id: items[items?.length - 1]?.id,
                    updatedAt: items[items?.length - 1]?.updatedAt,
                }
                : null;

            return {
                items,
                nextCursor
            };






        }),


    getManyTrending: baseProcedure
        .input(
            z.object({
                myUserId: z.string().nullish(),
                cursor: z.object({
                    id: z.string(),
                    viewCount: z.number()
                }).nullish(),
                limit: z.number().min(1).max(100),
                videoType: z.enum(["video", "short"]).optional(),
            }),
        )
        .query(async ({ ctx, input }) => {

            const { cursor, limit,  myUserId, videoType } = input;

            const clerkUserId = ctx.clerkUserId;
            let userId;

            // Get user ID if logged in
            const [user] = await db.select().from(users).where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))
            if (user) {
                userId = user.id;
            }
            const ViewCountSubQuery = db.$count(
                videosViews,
                eq(videosViews.videoId, videos.id)
            )
            const viewerReactions = db.$with("viewer_reactions").as(
                db.select({
                    videoId: videosReactions.videoId,
                    type: videosReactions.type,
                }).from(videosReactions)
                    .where(inArray(videosReactions.userId, userId ? [userId] : []))
            );

            const viewerSubscription = db.$with("viewer_subscription").as(
                db.select().from(Subscriptions)
                    .where(inArray(Subscriptions.viewerId, userId ? [userId] : []))
            );

            const data = await db
                .with(viewerReactions, viewerSubscription)
                .select({
                    ...getTableColumns(videos),
                    user: users,
                    viewCount: ViewCountSubQuery,
                    likeCount: db.$count(videosReactions, and(
                        eq(videosReactions.videoId, videos.id),
                        eq(videosReactions.type, "like")
                    )),
                    dislikeCount: db.$count(videosReactions, and(
                        eq(videosReactions.videoId, videos.id),
                        eq(videosReactions.type, "dislike")
                    )),
                    viewerReaction: viewerReactions.type,
                }).from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
                .leftJoin(viewerSubscription, eq(viewerSubscription.creatorId, users.id))
                .where(and(
                    eq(videos.videoVisibility, "public"),
                    (videoType === "video" || videoType === "short") ? eq(videos.videoType, videoType) : undefined,
                    cursor ? or(
                        lt(ViewCountSubQuery, cursor.viewCount),
                        and(
                            eq(ViewCountSubQuery, cursor.viewCount),
                            lt(videos.id, cursor.id)
                        )
                    ) : undefined,
                )).orderBy(
                    desc(sql`RANDOM()`),
                    desc(ViewCountSubQuery), desc(videoTopics.confidence), desc(videos.updatedAt), desc(videos.id)).limit(6)


            const hasMore = data.length > limit;
            const items = hasMore ? data.slice(0, -1).sort(() => Math.random() - 0.5) : data.sort(() => Math.random() - 0.5);

            const lastData = items[items.length - 1];
            const nextCursor = hasMore ? {
                id: lastData.id,
                viewCount: lastData.viewCount,
            } : null;
            return {
                items,
                nextCursor,
            };
        }),


    getManySubscribed: protectedProcedure
        .input(
            z.object({
                cursor: z.object({
                    id: z.string(),
                    updatedAt: z.date()
                }).nullish(),
                limit: z.number().min(1).max(100),
            }),
        )
        .query(async ({ ctx, input }) => {

            const { cursor, limit } = input;
            const { id: userId } = ctx.user;

            if (!userId) {
                throw new TRPCError({ code: "UNAUTHORIZED" })
            }

            const viewCountSub = db.$count(videosViews, eq(videosViews.videoId, videos.id));

            const viewSubscription = db.$with("view_subscription").as(
                db.select({
                    userId: Subscriptions.creatorId,
                }).from(Subscriptions)
                    .where(eq(Subscriptions.viewerId, userId))
            );


            const data = await db
                .with(viewSubscription)
                .select({
                    ...getTableColumns(videos),
                    user: users,
                    videoTopic: {
                        ...getTableColumns(videoTopics),
                    },
                    videoTag: {
                        ...getTableColumns(videoTags),
                    },
                    playlistId: sql<string>`NULL`,
                    viewCount: viewCountSub,
                    likeCount: db.$count(videosReactions, and(
                        eq(videosReactions.videoId, videos.id),
                        eq(videosReactions.type, "like")
                    )),
                    dislikeCount: db.$count(videosReactions, and(
                        eq(videosReactions.videoId, videos.id),
                        eq(videosReactions.type, "dislike")
                    ))

                }).from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .innerJoin(videoTopics, eq(videoTopics.videoId, videos.id))
                .innerJoin(videoTags, eq(videoTags.videoId, videos.id))
                .innerJoin(viewSubscription, eq(viewSubscription.userId, users.id))

                .where(
                    and(
                        eq(videos.videoVisibility, "public"),
                        cursor ? or(
                            lt(videos.updatedAt, cursor.updatedAt),
                            and(
                                eq(videos.updatedAt, cursor.updatedAt),
                                lt(videos.id, cursor.id)
                            )
                        ) : undefined,
                    )).orderBy(
                        asc(sql`RANDOM()`),
                        desc(videos.updatedAt), desc(videos.id)
                    ).limit(limit + 1)


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

});