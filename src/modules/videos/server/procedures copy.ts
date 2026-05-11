
// import { db } from "@/db";
// import { Subscriptions, users, userTopicPreferences, videos, videosReactions, videosViews, videoTags, videoTopics, videoUpdateSchema } from "@/db/schema";
// import { z } from "zod";
// import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
// import { eq, and, or, lt, desc, getTableColumns, inArray, isNotNull, sql, asc, not, ilike } from "drizzle-orm";
// import { TRPCError } from "@trpc/server";
// import { mux } from "@/lib/mux";
// import { UploadThingError, UTApi } from "uploadthing/server";
// import { AudienceAnalysisService, VideoTaggingService } from "@/lib/ai-tagging";
// import { th } from "date-fns/locale";


// export const videosRouter = createTRPCRouter({
//     reValidate: protectedProcedure
//         .input(z.object({
//             id: z.string()
//         }))
//         .mutation(async ({ ctx, input }) => {
//             try {
//                 const { id: userId } = ctx.user
//                 const [ExistingVideo] = await db.select().from(videos)
//                     .where(and(
//                         eq(videos.id, input.id),
//                         eq(videos.userId, userId),
//                     ))

//                 if (!ExistingVideo) {
//                     throw new TRPCError({ code: "NOT_FOUND" })
//                 }

//                 if (!ExistingVideo.muxUploadId) {
//                     throw new TRPCError({ code: "BAD_REQUEST" })
//                 }

//                 const directUpload = await mux.video.uploads.retrieve(
//                     ExistingVideo.muxUploadId
//                 )

//                 if (!directUpload || !directUpload.asset_id) {
//                     throw new TRPCError({ code: "BAD_REQUEST" })
//                 }

//                 const assets = await mux.video.assets.retrieve(
//                     directUpload.asset_id
//                 )
//                 if (!assets) {
//                     throw new TRPCError({ code: "BAD_REQUEST" })
//                 }
//                 const duration = assets.duration ? Math.round(assets.duration * 1000) : 0

//                 await db.update(videos).set({
//                     muxPlaybakId: null,
//                     muxAssetId: null,
//                     duration
//                 }).where(and(
//                     eq(videos.id, input.id),
//                     eq(videos.userId, userId),
//                 ))

//                 const [updateVid] = await db.update(videos).set({
//                     muxStatus: assets.status,
//                     muxPlaybakId: assets.playback_ids?.[0]?.id,
//                     muxAssetId: assets.id,
//                     duration
//                 }).where(and(
//                     eq(videos.id, input.id),
//                     eq(videos.userId, userId),
//                 )).returning()

//                 return updateVid

//             } catch (error) {
//                 throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
//             }

//         }),
//     autoTagVideo: protectedProcedure
//         .input(z.object({ videoId: z.string() }))
//         .mutation(async ({ input, ctx }) => {
//             const { videoId } = input;
//             const { id: userId } = ctx.user
//             if (!userId) {
//                 throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

//             }

//             // Get video metadata
//             const [video] = await db.select().from(videos)
//                 .where(and(
//                     eq(videos.id, videoId),
//                     eq(videos.userId, userId),
//                 ))


//             if (!video) throw new TRPCError({ code: "NOT_FOUND" });

//             const taggingService = new VideoTaggingService();
//             const { tags, topics } = await taggingService.extractTagsFromMetadata(
//                 video.title,
//                 video.description || ""
//             );

//             // Save tags and topics
//             await taggingService.saveTags(videoId, tags);
//             await taggingService.saveTopics(videoId, topics);
//             return {
//                 success: true,
//                 tagsCount: tags.length,
//                 topicsCount: topics.length,
//                 tags: tags.slice(0, 5),
//                 topics: topics.slice(0, 3)
//             };

//         }),
//     restoreThumbnail: protectedProcedure
//         .input(z.object({
//             id: z.string()
//         }))
//         .mutation(async ({ ctx, input }) => {
//             try {
//                 const { id: userId } = ctx.user
//                 if (!userId) {
//                     throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

//                 }
//                 const [ExistingVideo] = await db.select().from(videos)
//                     .where(and(
//                         eq(videos.id, input.id),
//                         eq(videos.userId, userId),
//                     ))

//                 if (!ExistingVideo) {
//                     throw new TRPCError({ code: "NOT_FOUND" })
//                 }

//                 if (ExistingVideo.thumbnailKey) {
//                     const utapi = new UTApi();

//                     await utapi.deleteFiles(ExistingVideo.thumbnailKey);
//                     await db.update(videos).set({
//                         thumbnailUrl: null,
//                         thumbnailKey: null,
//                     }).where(and(
//                         eq(videos.id, input.id),
//                         eq(videos.userId, userId),
//                     ))
//                 }

//                 if (!ExistingVideo.muxPlaybakId) {
//                     throw new TRPCError({ code: "BAD_REQUEST" })
//                 }

//                 const tempThumbnailUrl = `https://image.mux.com/${ExistingVideo.muxPlaybakId}/thumbnail.jpg`

//                 const utapi = new UTApi()
//                 const UPthumbnailUrl = await utapi.uploadFilesFromUrl(tempThumbnailUrl)

//                 if (!UPthumbnailUrl.data) {
//                     throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
//                 }

//                 const { key: thumbnailKey, ufsUrl: thumbnailUrl } = UPthumbnailUrl.data



//                 const [UpdateVideo] = await db.update(videos).set({ thumbnailUrl, thumbnailKey })
//                     .where(and(
//                         eq(videos.id, input.id),
//                         eq(videos.userId, userId),
//                     )).returning();

//                 return UpdateVideo;
//             } catch (error) {
//                 throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
//             }

//         }),
//     remove: protectedProcedure.input(z.object({
//         id: z.string()
//     })).mutation(async ({ ctx, input }) => {
//         try {
//             const { id: userId } = ctx.user
//             if (!userId) {
//                 throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

//             }
//             const [removeVideo] = await db.delete(videos)
//                 .where(and(
//                     eq(videos.id, input.id),
//                     eq(videos.userId, userId),
//                 )).returning()

//             if (!removeVideo) {
//                 throw new TRPCError({ code: "NOT_FOUND" })
//             }

//             return removeVideo;
//         } catch (error) {
//             throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
//         }

//     })
//     ,
//     update: protectedProcedure.input(videoUpdateSchema).mutation(
//         async ({ ctx, input }) => {
//             try {
//                 const { id: userId } = ctx.user;
//                 if (!userId) {
//                     throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

//                 }

//                 if (!input.id) {
//                     throw new TRPCError({ code: "BAD_REQUEST" })
//                 }

//                 const [updateVideo] = await db.update(videos)
//                     .set({
//                         title: input.title,
//                         description: input.description,
//                         videoVisibility: input.videoVisibility,
//                         updatedAt: new Date()
//                     }).where(and(
//                         eq(videos.id, input.id),
//                         eq(videos.userId, userId)
//                     )).returning()



//                 if (!updateVideo) { throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Failed To Create Video" }); }
//                 const taggingService = new VideoTaggingService();
//                 const { tags, topics } = await taggingService.extractTagsFromMetadata(
//                     updateVideo.title,
//                     updateVideo.description || ""
//                 );
//                 await taggingService.saveTags(updateVideo.id, tags);
//                 await taggingService.saveTopics(updateVideo.id, topics);

//                 return {
//                     video: {
//                         ...updateVideo,
//                         tags: tags.slice(0, 5),
//                         topics: topics.slice(0, 3),
//                     },
//                     type: input.videoType,
//                     tagsGenerated: tags.length,
//                     topicsGenerated: topics.length,
//                 };

//             }
//             catch (error) {
//                 console.error("Error updating video:", error);
//                 throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `${error}` })
//             }
//         }
//     )
//     ,
//     create: protectedProcedure.mutation(async ({ ctx }) => {

//         try {
//             const { id: userId } = ctx.user;
//             // // console.log(ctx.user)

//             if (!userId) {
//                 throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

//             }


//             const upload = await mux.video.uploads.create({
//                 new_asset_settings: {
//                     passthrough: userId,
//                     playback_policies: ["public"],
//                     master_access: "temporary",
//                     inputs: [
//                         {
//                             generated_subtitles: [
//                                 {
//                                     language_code: "en",
//                                     name: "English",
//                                 }]
//                         }
//                     ]
//                 },
//                 cors_origin: "*",
//             })

//             if (!upload.id) {
//                 throw new TRPCError({ code: "BAD_REQUEST", message: "Failed to upload vidieo" });
//             }

//             const [video] = await db.insert(videos).values({
//                 userId,
//                 title: "Untitled Video",
//                 muxStatus: "waiting",
//                 muxUploadId: upload.id,
//                 videoType: "video",
//             }).returning();

//             if (!video) {
//                 throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Failed To Publish Video" });

//             }
//             const taggingService = new VideoTaggingService();
//             const { tags, topics } = await taggingService.extractTagsFromMetadata(
//                 video.title,
//                 video.description || ""
//             );

//             await taggingService.saveTags(video.id, tags);
//             await taggingService.saveTopics(video.id, topics);

//             return {
//                 video: {
//                     ...video,
//                     tags: tags.slice(0, 5),
//                     topics: topics.slice(0, 3),
//                 },
//                 url: upload.url,
//                 tagsGenerated: tags.length,
//                 topicsGenerated: topics.length,
//                 type: "video"
//             };
//         }
//         catch (error) {
//             throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `${error}` });
//         }
//     }),
//     createShort: protectedProcedure.mutation(async ({ ctx }) => {
//         const { id: userId } = ctx.user;

//         if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

//         // Optimized for Shorts (vertical)
//         const upload = await mux.video.uploads.create({
//             new_asset_settings: {
//                 passthrough: `short_${userId}`,
//                 playback_policies: ["public"],
//                 master_access: "temporary",
//                 inputs: [
//                     {
//                         generated_subtitles: [
//                             {
//                                 language_code: "en",
//                                 name: "English",
//                             }]
//                     }
//                 ],
//             },
//             cors_origin: "*",
//         });

//         const [short] = await db.insert(videos).values({
//             userId,
//             title: "Untitled Short",
//             muxStatus: "waiting",
//             muxUploadId: upload.id,
//             videoType: "short",               // ← This is what makes it a Short
//         }).returning();
//         const taggingService = new VideoTaggingService();

//         const { tags, topics } = await taggingService.extractTagsFromMetadata(
//             short.title,
//             short.description || ""
//         );

//         await taggingService.saveTags(short.id, tags);
//         await taggingService.saveTopics(short.id, topics);
//         return {
//             video: short,
//             url: upload.url,
//             tagsGenerated: tags.length,
//             topicsGenerated: topics.length,
//             type: "short"
//         };
//     }),
//     getOne: baseProcedure.input(z.object({
//         id: z.string().nullish(),
//         videoType: z.enum(["video", "short"]).default("video").optional(),
//     })).query(
//         async ({ input, ctx }) => {
//             const clerkUserId = ctx.clerkUserId;
//             const videoId = input.id;
//             const videoType = input.videoType;

//             let userId;

//             const [user] = await db.select().from(users).where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

//             if (user) {
//                 userId = user.id;
//             }

//             const viewerReactions = db.$with("viewer_reactions").as(
//                 db.select({
//                     videoId: videosReactions.videoId,
//                     type: videosReactions.type,
//                 }).from(videosReactions)
//                     .where(inArray(videosReactions.userId, userId ? [userId] : []))
//             );

//             const viewerSubscription =
//                 db.$with("viewer_subscription").as(
//                     db.select().from(Subscriptions)
//                         .where(inArray(Subscriptions.viewerId, userId ? [userId] : []))
//                 );

//             const viewCountSub = db.$count(videosViews, eq(videosViews.videoId, videos.id));

//             const [existingVid] = await db
//                 .with(viewerReactions, viewerSubscription)
//                 .select({
//                     ...getTableColumns(videos),
//                     user: {
//                         ...getTableColumns(users),
//                         subscriberCount: db.$count(Subscriptions, eq(Subscriptions.creatorId, users.id)),
//                         viewerSubscribed: isNotNull(viewerSubscription.viewerId).mapWith(Boolean)
//                     },
//                     viewCount: viewCountSub,
//                     likeCount: db.$count(videosReactions,
//                         and(
//                             eq(videosReactions.videoId, videos.id),
//                             eq(videosReactions.type, "like")
//                         )),
//                     dislikeCount: db.$count(videosReactions, and(
//                         eq(videosReactions.videoId, videos.id),
//                         eq(videosReactions.type, "dislike")
//                     )),
//                     viewerReaction: viewerReactions.type

//                 }).from(videos)
//                 .innerJoin(users, eq(videos.userId, users.id))
//                 .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
//                 .leftJoin(viewerSubscription, eq(viewerSubscription.creatorId, users.id))
//                 .where(and(
//                     input.id ? eq(videos.id, input.id) : undefined,
//                     // eq(videos.videoVisibility, 'public'),
//                     videoType ? eq(videos.videoType, videoType) : undefined
//                 ))

//             if (!existingVid) {
//                 throw new TRPCError({ code: "NOT_FOUND", message: "Missing User Id, Try Signing In Again" });

//             }
//             return existingVid;

//         }
//     ),
//     // In your videosRouter

//     // getCoordinatedHomeFeed: baseProcedure
//     //     .input(z.object({
//     //         limit: z.number().min(1).max(100).default(50),
//     //     }))
//     //     .query(async ({ ctx, input }) => {
//     //         const { limit } = input;
//     //         const clerkUserId = ctx.clerkUserId;

//     //         // Get user ID if logged in
//     //         let userId;
//     //         const [user] = await db.select().from(users).where(
//     //             inArray(users.clerkId, clerkUserId ? [clerkUserId] : [])
//     //         );
//     //         if (user) userId = user.id;

//     //         // Use the feed coordination service
//     //         const feedService = new FeedCoordinationService();
//     //         const coordinatedFeed = await feedService.getCoordinatedHomeFeed(userId, userId);

//     //         return coordinatedFeed;
//     //     }),

//     getMany: baseProcedure
//         .input(
//             z.object({
//                 categoryType: z.string().optional(),
//                 //topicName: z.string().optional(),
//                 categoryId: z.string().nullish(),
//                 videoType: z.enum(["video", "short"]),
//                 //sourceVideoId: z.string().optional(), // For "related" type - the video we're finding similar content for
//                 cursor: z
//                     .object({
//                         id: z.string(),
//                         updatedAt: z.date(),
//                         score: z.number().optional(), // For sorting by relevance score
//                     })
//                     .nullish(),
//                 limit: z.number().min(1).max(100),
//             }),
//         )
//         .query(async ({ ctx, input }) => {
//             const {
//                 cursor,
//                 limit,
//                 categoryType,
//                 //topicName,
//                 categoryId,
//                 videoType,
//                 //sourceVideoId
//             } = input;

//             const clerkUserId = ctx.clerkUserId;
//             let userId;

//             // Get user ID if logged in
//             const [user] = await db.select().from(users).where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))
//             if (user) {
//                 userId = user.id;
//             }
// // const sourceTags = await db.query.videoTags.findMany({
// //                 where: eq(videoTags., videoId)
// //             });
            
// //             if (sourceTags.length === 0) {
// //                 return { items: [] };
// //             }

//             // Base conditions that always 
//             let userVideoTopic;
//             if (categoryId) {
//                   const [topicId] = await db
//         .select()
//         .from(videoTopics)
//          .where(
//            eq(videoTopics.id, categoryId)
//         )
     
//         const topicTiles = await db
//         .select()
//         .from(videoTopics)
//          .where(
//            topicId ? eq(videoTopics.topicName, topicId.topicName): undefined
//         )

//           userVideoTopic = topicTiles.map(t => t.topicName);
//             }
      
//             const baseConditions = [
//                 eq(videos.videoVisibility, 'public'),
//                 (videoType === "video" || videoType === "short") ? eq(videos.videoType, videoType) : undefined,
//             ].filter(Boolean);

//             // ========== HANDLE DIFFERENT FEED TYPES ==========

//             // 1. TRENDING FEED - Most popular videos right now
//             if (categoryType === "trending") {
//                  const ViewCountSubQuery = db.$count(
//         videosViews,
//         eq(videosViews.videoId, videos.id)
//     )
// // console.log({userVideoTopic, section: "Trending"})   
//     const data = await db
//         .select({
//             ...getTableColumns(videos),
//             user: users,
//             viewCount: ViewCountSubQuery,
//             likeCount: db.$count(videosReactions, and(
//                 eq(videosReactions.videoId, videos.id),
//                 eq(videosReactions.type, "like")
//             )),
//             dislikeCount: db.$count(videosReactions, and(
//                 eq(videosReactions.videoId, videos.id),
//                 eq(videosReactions.type, "dislike")
//             )),
//             topicConfidence: videoTopics.confidence,

//         }).from(videos)
//         .innerJoin(users, eq(videos.userId, users.id))
//         .innerJoin(videoTopics, eq(videoTopics.videoId, videos.id))
//         .where(and(
//             ...baseConditions,
//             cursor ? or(
//                 lt(ViewCountSubQuery, cursor.score),
//                 and(
//                     eq(ViewCountSubQuery, cursor.score),
//                     lt(videos.id, cursor.id)
//                 )
//             ) : undefined,
//         )).orderBy(
//             desc(sql`RANDOM()`),
//             desc(ViewCountSubQuery), desc(videoTopics.confidence), desc(videos.updatedAt), desc(videos.id)).limit(3)


//     const hasMore = data.length > limit;
//     const items = hasMore ? data.slice(0, -1) : data.sort(() => Math.random() - 0.5);

//     const lastData = items[items.length - 1];
//     const nextCursor = hasMore ? {
//         id: lastData.id,
//         score: lastData.viewCount,
//     } : null;
//     return {
//         items,
//         nextCursor,
//     };
//                 // return await getTrendingFeed({
//                 //     baseConditions,
//                 //     userId,
//                 //     cursor,
//                 //     limit,
//                 //     clerkUserId,
//                 //     userVideoTopic
//                 // });
//             }

//             // 2. FOR-YOU FEED - Personalized recommendations
//             // if (categoryType === "for-you") {
//             //     return await getPersonalizedFeed({
//             //         baseConditions,
//             //         userId,
//             //         cursor,
//             //         limit,
//             //         clerkUserId,
//             //         userVideoTopic
//             //     });
//             // }

//             // 3. TOPIC FEED - All videos about a specific topic
//             // if (categoryType === "topic") {
//             //     if (!topicName) {
//             //         throw new TRPCError({ code: "BAD_REQUEST", message: "topicName required for topic feed" });
//             //     }
//             //     return await getTopicFeed({
//             //         baseConditions,
//             //         topicName,
//             //         userId,
//             //         cursor,
//             //         limit,
//             //         clerkUserId,
//             //         userVideoTopic
//             //     });
//             // }

//             // 4. RELATED FEED - Videos similar to source video
//             // if (categoryType === "related") {
//             //     if (!sourceVideoId) {
//             //         throw new TRPCError({ code: "BAD_REQUEST", message: "sourceVideoId required for related feed" });
//             //     }
//             //     return await getRelatedFeed({
//             //         baseConditions,
//             //         sourceVideoId,
//             //         userId,
//             //         cursor,
//             //         limit,
//             //         clerkUserId,
//             //         userVideoTopic
//             //     });
//             // }

//              const viewerReactions = db.$with("viewer_reactions").as(
//         db.select({
//             videoId: videosReactions.videoId,
//             type: videosReactions.type,
//         }).from(videosReactions)
//             .where(inArray(videosReactions.userId, userId ? [userId] : []))
//     );

//     const viewerSubscription = db.$with("viewer_subscription").as(
//         db.select().from(Subscriptions)
//             .where(inArray(Subscriptions.viewerId, userId ? [userId] : []))
//     );
//     const topic = userVideoTopic && userVideoTopic.length > 0 ? `${userVideoTopic[0]?.split("")[0]}${userVideoTopic[0]?.split("")[1]}`: undefined;
//// console.log({topic})

//     const sourceTags = await db.select().from(videoTags).where(
//          ilike(videoTags.tagName, `%${topic}%`),
        
//     );
//    // console.log({userVideoTopic,sourceTags, section: "default Feed"}) 

// //     const userPreferences = await db.select().from(userTopicPreferences).where(
// //         eq(userTopicPreferences.userId, userId)
// //     ).orderBy(desc(userTopicPreferences.affinity)).limit(10);

// //   const topicAffinity = new Map(userPreferences.map(p => [p.topicName, p.affinity]));
// //     const preferredTopics = userPreferences.map(p => p.topicName);
            

//     const conditions = [
//         ...baseConditions,
//      userVideoTopic && userVideoTopic.length > 0 ?   inArray(videoTopics.topicName, userVideoTopic) : undefined,
//       cursor ? or(
//             lt(videos.updatedAt, cursor.updatedAt),
//             and(eq(videos.updatedAt, cursor.updatedAt), lt(videos.id, cursor.id)),
//         ) : undefined,
//     ].filter(Boolean);

//     const data = await db
//         .with(viewerReactions, viewerSubscription)
//         .select({
//             ...getTableColumns(videos),
//             user: {
//                 ...getTableColumns(users),
//                 subscriberCount: db.$count(Subscriptions, eq(Subscriptions.creatorId, users.id)),
//                 viewerSubscribed: isNotNull(viewerSubscription.viewerId).mapWith(Boolean)
//             },
//             viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
//             likeCount: db.$count(
//                 videosReactions,
//                 and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'like')),
//             ),
//             dislikeCount: db.$count(
//                 videosReactions,
//                 and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'dislike')),
//             ),
//             viewerReaction: viewerReactions.type,
//         })
//         .from(videos)
//         .innerJoin(users, eq(videos.userId, users.id))
//         .innerJoin(videoTopics, eq(videoTopics.videoId, videos.id))
//         //.innerJoin(videoTags, eq(videoTags.videoId, videos.id))
//         .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
//         .leftJoin(viewerSubscription, eq(viewerSubscription.creatorId, users.id))
//         .where(and(...conditions))
//         .orderBy(desc(sql`RANDOM()`), desc(videos.updatedAt), desc(videos.id))
//         .limit(limit + 1);

//     const hasMore = data.length > limit;
//     const items = hasMore ? data.slice(0, -1).sort(() => Math.random() - 0.5) : data.sort(() => Math.random() - 0.5);

//     const nextCursor = hasMore ? {
//         id: items[items.length - 1].id,
//         updatedAt: items[items.length - 1].updatedAt,
//     } : null;

//     return { items, nextCursor };
//             // Default fallback - newest first
//             // return await getDefaultFeed({
//             //     baseConditions,
//             //     userId,
//             //     cursor,
//             //     limit,
//             //     clerkUserId,
//             //     userVideoTopic
//             // });
//         }),
//     getManyTrending: baseProcedure
//         .input(
//             z.object({
//                 cursor: z.object({
//                     id: z.string(),
//                     viewCount: z.number()
//                 }).nullish(),
//                 limit: z.number().min(1).max(100),
//             }),
//         )
//         .query(async ({ ctx, input }) => {

//             const { cursor, limit, } = input;

//             const ViewCountSubQuery = db.$count(
//                 videosViews,
//                 eq(videosViews.videoId, videos.id)
//             )

//             const data = await db
//                 .select({
//                     ...getTableColumns(videos),
//                     user: users,
//                     viewCount: ViewCountSubQuery,
//                     likeCount: db.$count(videosReactions, and(
//                         eq(videosReactions.videoId, videos.id),
//                         eq(videosReactions.type, "like")
//                     )),
//                     dislikeCount: db.$count(videosReactions, and(
//                         eq(videosReactions.videoId, videos.id),
//                         eq(videosReactions.type, "dislike")
//                     ))

//                 }).from(videos)
//                 .innerJoin(users, eq(videos.userId, users.id))
//                 .where(and(
//                     eq(videos.videoVisibility, "public"),
//                     eq(videos.videoType, "video"),
//                     cursor ? or(
//                         lt(ViewCountSubQuery, cursor.viewCount),
//                         and(
//                             eq(ViewCountSubQuery, cursor.viewCount),
//                             lt(videos.id, cursor.id)
//                         )
//                     ) : undefined,
//                 )).orderBy(
//                     desc(sql`RANDOM()`),
//                     desc(ViewCountSubQuery), desc(videos.updatedAt), desc(videos.id)).limit(3)


//             const hasMore = data.length > limit;
//             const items = hasMore ? data.slice(0, -1) : data.sort(() => Math.random() - 0.5);

//             const lastData = items[items.length - 1];
//             const nextCursor = hasMore ? {
//                 id: lastData.id,
//                 viewCount: lastData.viewCount,
//             } : null;
//             return {
//                 items,
//                 nextCursor,
//             };
//         }),


//     getManySubscribed: protectedProcedure
//         .input(
//             z.object({
//                 cursor: z.object({
//                     id: z.string(),
//                     updatedAt: z.date()
//                 }).nullish(),
//                 limit: z.number().min(1).max(100),
//             }),
//         )
//         .query(async ({ ctx, input }) => {

//             const { cursor, limit } = input;
//             const { id: userId } = ctx.user;

//             if (!userId) {
//                 throw new TRPCError({ code: "UNAUTHORIZED" })
//             }

//             const viewCountSub = db.$count(videosViews, eq(videosViews.videoId, videos.id));

//             const viewSubscription = db.$with("view_subscription").as(
//                 db.select({
//                     userId: Subscriptions.creatorId,
//                 }).from(Subscriptions)
//                     .where(eq(Subscriptions.viewerId, userId))
//             );


//             const data = await db
//                 .with(viewSubscription)
//                 .select({
//                     ...getTableColumns(videos),
//                     user: users,
//                     viewCount: viewCountSub,
//                     likeCount: db.$count(videosReactions, and(
//                         eq(videosReactions.videoId, videos.id),
//                         eq(videosReactions.type, "like")
//                     )),
//                     dislikeCount: db.$count(videosReactions, and(
//                         eq(videosReactions.videoId, videos.id),
//                         eq(videosReactions.type, "dislike")
//                     ))

//                 }).from(videos)
//                 .innerJoin(users, eq(videos.userId, users.id))
//                 .innerJoin(viewSubscription, eq(viewSubscription.userId, users.id))

//                 .where(and(
//                     eq(videos.videoVisibility, "public"),
//                     cursor ? or(
//                         lt(videos.updatedAt, cursor.updatedAt),
//                         and(
//                             eq(videos.updatedAt, cursor.updatedAt),
//                             lt(videos.id, cursor.id)
//                         )
//                     ) : undefined,
//                 )).orderBy(
//                     asc(sql`RANDOM()`),
//                     // desc(videos.updatedAt), desc(videos.id)
//                 ).limit(limit + 1)


//             const hasMore = data.length > limit;
//             const items = hasMore ? data.slice(0, -1) : data;

//             const lastData = items[items.length - 1];
//             const nextCursor = hasMore ? {
//                 id: lastData.id,
//                 updatedAt: lastData.updatedAt,
//             } : null;

//             return {
//                 items,
//                 nextCursor,
//             };
//         }),


//     // getVideosByDynamicCategory: baseProcedure
//     //     .input(z.object({
//     //         categoryType: z.enum(["trending", "for-you", "related", "topic"]),
//     //         topicName: z.string().optional(),
//     //         limit: z.number().default(20),
//     //         cursor: z.string().nullish(),
//     //         userId: z.string().optional()
//     //     }))
//     //     .query(async ({ input }) => {
//     //         const { categoryType, topicName, limit, cursor, userId } = input;

//     //         switch(categoryType) {
//     //             case "trending":
//     //                 return await getTrendingVideos(limit);
//     //             case "for-you":
//     //                 return await getPersonalizedFeed(userId, limit, cursor);
//     //             case "topic":
//     //                 if (!topicName) throw new Error("Topic name required");
//     //                 return //await getVideosByTopic(topicName, limit, cursor);
//     //             case "related":
//     //                 return await getRelatedVideos(cursor, limit);
//     //             default:
//     //                 return await getDefaultFeed(limit, cursor);
//     //         }
//     //     }),


// });


// async function getTrendingFeed({ baseConditions, userId, cursor, limit, clerkUserId, userVideoTopic }: any) {
//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//     const ViewCountSubQuery = db.$count(
//         videosViews,
//         eq(videosViews.videoId, videos.id)
//     )
// // console.log({userVideoTopic, section: "Trending"})   
//     const data = await db
//         .select({
//             ...getTableColumns(videos),
//             user: users,
//             viewCount: ViewCountSubQuery,
//             likeCount: db.$count(videosReactions, and(
//                 eq(videosReactions.videoId, videos.id),
//                 eq(videosReactions.type, "like")
//             )),
//             dislikeCount: db.$count(videosReactions, and(
//                 eq(videosReactions.videoId, videos.id),
//                 eq(videosReactions.type, "dislike")
//             )),
//             topicConfidence: videoTopics.confidence,

//         }).from(videos)
//         .innerJoin(users, eq(videos.userId, users.id))
//         .innerJoin(videoTopics, eq(videoTopics.videoId, videos.id))
//         .where(and(
//             ...baseConditions,
//             cursor ? or(
//                 lt(ViewCountSubQuery, cursor.score),
//                 and(
//                     eq(ViewCountSubQuery, cursor.score),
//                     lt(videos.id, cursor.id)
//                 )
//             ) : undefined,
//         )).orderBy(
//             desc(sql`RANDOM()`),
//             desc(ViewCountSubQuery), desc(videoTopics.confidence), desc(videos.updatedAt), desc(videos.id)).limit(3)


//     const hasMore = data.length > limit;
//     const items = hasMore ? data.slice(0, -1) : data.sort(() => Math.random() - 0.5);

//     const lastData = items[items.length - 1];
//     const nextCursor = hasMore ? {
//         id: lastData.id,
//         score: lastData.viewCount,
//     } : null;
//     return {
//         items,
//         nextCursor,
//     };

// }

// async function getPersonalizedFeed({ baseConditions, userId, cursor, limit, clerkUserId, userVideoTopic }: any) {
//     if (!userId) {
//         return await getDefaultFeed({ baseConditions, userId, cursor, limit, clerkUserId, userVideoTopic });
//     }
//// console.log({userVideoTopic, section: "personalized Feed"})   
//     const userPreferences = await db.select().from(userTopicPreferences).where(
//         eq(userTopicPreferences.userId, userId)
//     ).orderBy(desc(userTopicPreferences.affinity)).limit(10);

//     // If user has no preferences, show popular content
//     if (userPreferences.length === 0) {
//         return await getDefaultFeed({ baseConditions, userId, cursor, limit, clerkUserId });
//     }

//     const topicAffinity = new Map(userPreferences.map(p => [p.topicName, p.affinity]));
//     const preferredTopics = userPreferences.map(p => p.topicName);

//     // CTEs
//     const viewerReactions = db.$with("viewer_reactions").as(
//         db.select({
//             videoId: videosReactions.videoId,
//             type: videosReactions.type,
//         }).from(videosReactions)
//             .where(inArray(videosReactions.userId, userId ? [userId] : []))
//     );

//     const viewerSubscription = db.$with("viewer_subscription").as(
//         db.select().from(Subscriptions)
//             .where(inArray(Subscriptions.viewerId, userId ? [userId] : []))
//     );

//      const matchingVideos = await db
//         .with(viewerReactions, viewerSubscription)
//         .select({
//             ...getTableColumns(videos),
//             user: {
//                 ...getTableColumns(users),
//                 subscriberCount: db.$count(Subscriptions, eq(Subscriptions.creatorId, users.id)),
//                 viewerSubscribed: sql<boolean>`${viewerSubscription.viewerId} IS NOT NULL`
//             },
//             viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
//             likeCount: db.$count(
//                 videosReactions,
//                 and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'like')),
//             ),
//             dislikeCount: db.$count(
//                 videosReactions,
//                 and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'dislike')),
//             ),
//             viewerReaction: viewerReactions.type,
//             topicMatchScore: sql<number>`MAX(${videoTopics.confidence})`,
//         })
//         .from(videos)
//         .innerJoin(users, eq(videos.userId, users.id))
//         .innerJoin(videoTopics, eq(videoTopics.videoId, videos.id))
//         .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
//         .leftJoin(viewerSubscription, eq(viewerSubscription.creatorId, users.id))
//         .where(and(
//             eq(videos.videoVisibility, "public"),
//             inArray(videoTopics.topicName, preferredTopics),
//             cursor ? or(
//                 lt(videos.updatedAt, cursor.updatedAt),
//                 and(eq(videos.updatedAt, cursor.updatedAt), lt(videos.id, cursor.id))
//             ) : undefined,
//             ...baseConditions
//         ))
//         .groupBy(videos.id, users.id, viewerReactions.type, viewerSubscription.viewerId)
//         .orderBy(desc(videos.updatedAt), desc(videos.id))
//         .limit(limit + 5);
    
//     if (matchingVideos.length === 0) {
//         return { items: [], nextCursor: null };
//     }
    
//     // Calculate relevance scores for each video
//     const scoredVideosPromises = matchingVideos.map(async (video) => {
//         let score = 0;
        
//         // Get viewers of this video
//         const viewers = await db
//             .select({ userId: videosViews.userId })
//             .from(videosViews)
//             .where(eq(videosViews.videoId, video.id));
        
//         if (viewers.length === 0) {
//             // No viewers yet, use basic scoring
//             score = (video.viewCount / 10000) * 0.5;
//             score += (video.likeCount / 1000) * 0.3;
//             score += Math.random() * 0.2;
            
//             return {
//                 ...video,
//                 relevanceScore: score
//             };
//         }
        
//         const viewerIds = viewers.map(v => v.userId);
        
//         // Get viewing history for these users (excluding current video)
//         const userHistory = await db
//             .select({
//                 userId: videosViews.userId,
//                 videoId: videosViews.videoId,
//             })
//             .from(videosViews)
//             .where(and(
//                 inArray(videosViews.userId, viewerIds),
//                 sql`${videosViews.videoId} != ${video.id}`
//             ));
        
//         if (userHistory.length === 0) {
//             // No history data, use basic scoring
//             score = (video.viewCount / 10000) * 0.5;
//             score += (video.likeCount / 1000) * 0.3;
//             score += Math.random() * 0.2;
            
//             return {
//                 ...video,
//                 relevanceScore: score
//             };
//         }
        
//         // Get topics for this video
//         const videoTopicsData = await db
//             .select()
//             .from(videoTopics)
//             .where(eq(videoTopics.videoId, video.id));
        
//         if (videoTopicsData.length === 0) {
//             // No topics, use basic scoring
//             score = (video.viewCount / 10000) * 0.5;
//             score += (video.likeCount / 1000) * 0.3;
//             score += Math.random() * 0.2;
            
//             return {
//                 ...video,
//                 relevanceScore: score
//             };
//         }
        
//         // Calculate topic-based engagement score
//         const topicCounts = new Map<string, { count: number; totalConfidence: number }>();
        
//         for (const topic of videoTopicsData) {
//             const existing = topicCounts.get(topic.topicName) || { count: 0, totalConfidence: 0 };
//             topicCounts.set(topic.topicName, {
//                 count: existing.count + 1,
//                 totalConfidence: existing.totalConfidence + (topic.confidence || 0.5)
//             });
//         }
        
//         // Calculate engagement score from top topics
//         let engagementScore = 0;
//         for (const [topicName, data] of topicCounts.entries()) {
//             // Find how many viewers watched videos with this topic
//             const viewersWithTopic = await db
//                 .select({ count: sql<number>`COUNT(DISTINCT ${videosViews.userId})` })
//                 .from(videosViews)
//                 .innerJoin(videoTopics, eq(videoTopics.videoId, videosViews.videoId))
//                 .where(and(
//                     inArray(videosViews.userId, viewerIds),
//                     eq(videoTopics.topicName, topicName)
//                 ));
            
//             const topicScore = (Number(viewersWithTopic[0]?.count || 0) / viewerIds.length) * (data.totalConfidence / data.count);
//             engagementScore = Math.max(engagementScore, topicScore);
//         }
        
//         // Calculate final score
//         score = engagementScore * 0.5; // 50% from topic engagement
//         score += Math.min(video.viewCount / 10000, 0.3); // 30% from view count (capped)
//         score += Math.min(video.likeCount / 1000, 0.2); // 20% from likes (capped)
//         score += Math.random() * 0.05; // Small randomization for diversity
        
//         return {
//             ...video,
//             relevanceScore: Math.min(score, 1.0) // Cap at 1.0
//         };
//     });
    
//     // Wait for all promises to resolve
//     const scoredVideos = await Promise.all(scoredVideosPromises);
    
//     // Filter out any undefined results and sort by relevance score
//     const validVideos = scoredVideos.filter(v => v !== undefined && v !== null);
//     validVideos.sort((a, b) => (b?.relevanceScore || 0) - (a?.relevanceScore || 0));
    
//     const hasMore = validVideos.length > limit;
//     const items = hasMore ? validVideos.slice(0, limit) : validVideos;
    
//     const nextCursor = hasMore && items[items.length - 1] ? {
//         id: items[items.length - 1].id,
//         updatedAt: items[items.length - 1].updatedAt,
//     } : null;
    
//     return {
//         items,
//         nextCursor,
//     };
// }

// // 3. TOPIC FEED - All videos about a specific topic
// async function getTopicFeed({ baseConditions, topicName, userId, cursor, limit, clerkUserId, userVideoTopic }: any) {
//     const viewerReactions = db.$with("viewer_reactions").as(
//         db.select({
//             videoId: videosReactions.videoId,
//             type: videosReactions.type,
//         }).from(videosReactions)
//             .where(inArray(videosReactions.userId, userId ? [userId] : []))
//     );

//     const viewerSubscription = db.$with("viewer_subscription").as(
//         db.select().from(Subscriptions)
//             .where(inArray(Subscriptions.viewerId, userId ? [userId] : []))
//     );

//     const data = await db
//         .with(viewerReactions, viewerSubscription)
//         .select({
//             ...getTableColumns(videos),
//             user: {
//                 ...getTableColumns(users),
//                 subscriberCount: db.$count(Subscriptions, eq(Subscriptions.creatorId, users.id)),
//                 viewerSubscribed: isNotNull(viewerSubscription.viewerId).mapWith(Boolean)
//             },
//             viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
//             likeCount: db.$count(
//                 videosReactions,
//                 and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'like')),
//             ),
//             dislikeCount: db.$count(
//                 videosReactions,
//                 and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'dislike')),
//             ),
//             viewerReaction: viewerReactions.type,
//             topicConfidence: videoTopics.confidence,
//         })
//         .from(videos)
//         .innerJoin(users, eq(videos.userId, users.id))
//         .innerJoin(videoTopics, eq(videoTopics.videoId, videos.id))
//         .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
//         .leftJoin(viewerSubscription, eq(viewerSubscription.creatorId, users.id))
//         .where(and(
//             ...baseConditions,
//             eq(videoTopics.topicName, topicName),
//             cursor ? or(
//                 lt(videos.updatedAt, cursor.updatedAt),
//                 and(eq(videos.updatedAt, cursor.updatedAt), lt(videos.id, cursor.id))
//             ) : undefined,
//         ))
//         .groupBy(videos.id, users.id, viewerReactions.type, viewerSubscription.viewerId, videoTopics.confidence)
//         .orderBy(desc(videoTopics.confidence), desc(videos.updatedAt), desc(videos.id))
//         .limit(limit + 1);

//     const hasMore = data.length > limit;
//     const items = hasMore ? data.slice(0, -1) : data;

//     const nextCursor = hasMore ? {
//         id: items[items.length - 1].id,
//         updatedAt: items[items.length - 1].updatedAt,
//     } : null;

//     return { items, nextCursor };
// }

// // 4. RELATED FEED - Videos similar to source video
// async function getRelatedFeed({ baseConditions, sourceVideoId, userId, cursor, limit, clerkUserId, userVideoTopic }: any) {
//     // Get tags of source video
//     const sourceTags = await db.query.videoTags.findMany({
//         where: eq(videoTags.videoId, sourceVideoId),
//         limit: 10
//     });

//     if (sourceTags.length === 0) {
//         // No tags found, fall back to default
//         return await getDefaultFeed({ baseConditions, userId, cursor, limit, clerkUserId });
//     }

//     const tagNames = sourceTags.map(t => t.tagName);

//     const viewerReactions = db.$with("viewer_reactions").as(
//         db.select({
//             videoId: videosReactions.videoId,
//             type: videosReactions.type,
//         }).from(videosReactions)
//             .where(inArray(videosReactions.userId, userId ? [userId] : []))
//     );

//     const viewerSubscription = db.$with("viewer_subscription").as(
//         db.select().from(Subscriptions)
//             .where(inArray(Subscriptions.viewerId, userId ? [userId] : []))
//     );

//     const data = await db
//         .with(viewerReactions, viewerSubscription)
//         .select({
//             ...getTableColumns(videos),
//             user: {
//                 ...getTableColumns(users),
//                 subscriberCount: db.$count(Subscriptions, eq(Subscriptions.creatorId, users.id)),
//                 viewerSubscribed: isNotNull(viewerSubscription.viewerId).mapWith(Boolean)
//             },
//             viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
//             likeCount: db.$count(
//                 videosReactions,
//                 and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'like')),
//             ),
//             dislikeCount: db.$count(
//                 videosReactions,
//                 and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'dislike')),
//             ),
//             viewerReaction: viewerReactions.type,
//             similarityScore: sql<number>`COUNT(DISTINCT ${videoTags.tagName})`,
//         })
//         .from(videos)
//         .innerJoin(users, eq(videos.userId, users.id))
//         .innerJoin(videoTags, eq(videoTags.videoId, videos.id))
//         .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
//         .leftJoin(viewerSubscription, eq(viewerSubscription.creatorId, users.id))
//         .where(and(
//             ...baseConditions,
//             not(eq(videos.id, sourceVideoId)),
//             inArray(videoTags.tagName, tagNames),
//             cursor ? or(
//                 lt(videos.updatedAt, cursor.updatedAt),
//                 and(eq(videos.updatedAt, cursor.updatedAt), lt(videos.id, cursor.id))
//             ) : undefined,
//         ))
//         .groupBy(videos.id, users.id, viewerReactions.type, viewerSubscription.viewerId)
//         .orderBy(desc(sql`similarityScore`), desc(videos.updatedAt), desc(videos.id))
//         .limit(limit + 1);

//     const hasMore = data.length > limit;
//     const items = hasMore ? data.slice(0, -1) : data;

//     const nextCursor = hasMore ? {
//         id: items[items.length - 1].id,
//         updatedAt: items[items.length - 1].updatedAt,
//     } : null;

//     return { items, nextCursor };
// }


// async function getDefaultFeed({ baseConditions, userId, cursor, limit, clerkUserId, userVideoTopic }: any) {
//     const viewerReactions = db.$with("viewer_reactions").as(
//         db.select({
//             videoId: videosReactions.videoId,
//             type: videosReactions.type,
//         }).from(videosReactions)
//             .where(inArray(videosReactions.userId, userId ? [userId] : []))
//     );

//     const viewerSubscription = db.$with("viewer_subscription").as(
//         db.select().from(Subscriptions)
//             .where(inArray(Subscriptions.viewerId, userId ? [userId] : []))
//     );
//     const topic = userVideoTopic.length > 0 ? `${userVideoTopic[0]?.split("")[0]}${userVideoTopic[0]?.split("")[1]}`: undefined;
//// console.log({topic})

//     const sourceTags = await db.select().from(videoTags).where(
//          ilike(videoTags.tagName, `%${topic}%`),
        
//     );
//    // console.log({userVideoTopic,sourceTags, section: "default Feed"}) 

// //     const userPreferences = await db.select().from(userTopicPreferences).where(
// //         eq(userTopicPreferences.userId, userId)
// //     ).orderBy(desc(userTopicPreferences.affinity)).limit(10);

// //   const topicAffinity = new Map(userPreferences.map(p => [p.topicName, p.affinity]));
// //     const preferredTopics = userPreferences.map(p => p.topicName);
            

//     const conditions = [
//         ...baseConditions,
//         inArray(videoTopics.topicName, userVideoTopic),
//       cursor ? or(
//             lt(videos.updatedAt, cursor.updatedAt),
//             and(eq(videos.updatedAt, cursor.updatedAt), lt(videos.id, cursor.id)),
//         ) : undefined,
//     ].filter(Boolean);

//     const data = await db
//         .with(viewerReactions, viewerSubscription)
//         .select({
//             ...getTableColumns(videos),
//             user: {
//                 ...getTableColumns(users),
//                 subscriberCount: db.$count(Subscriptions, eq(Subscriptions.creatorId, users.id)),
//                 viewerSubscribed: isNotNull(viewerSubscription.viewerId).mapWith(Boolean)
//             },
//             viewCount: db.$count(videosViews, eq(videosViews.videoId, videos.id)),
//             likeCount: db.$count(
//                 videosReactions,
//                 and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'like')),
//             ),
//             dislikeCount: db.$count(
//                 videosReactions,
//                 and(eq(videosReactions.videoId, videos.id), eq(videosReactions.type, 'dislike')),
//             ),
//             viewerReaction: viewerReactions.type,
//         })
//         .from(videos)
//         .innerJoin(users, eq(videos.userId, users.id))
//         .innerJoin(videoTopics, eq(videoTopics.videoId, videos.id))
//         //.innerJoin(videoTags, eq(videoTags.videoId, videos.id))
//         .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
//         .leftJoin(viewerSubscription, eq(viewerSubscription.creatorId, users.id))
//         .where(and(...conditions))
//         .orderBy(desc(sql`RANDOM()`), desc(videos.updatedAt), desc(videos.id))
//         .limit(limit + 1);

//     const hasMore = data.length > limit;
//     const items = hasMore ? data.slice(0, -1).sort(() => Math.random() - 0.5) : data.sort(() => Math.random() - 0.5);

//     const nextCursor = hasMore ? {
//         id: items[items.length - 1].id,
//         updatedAt: items[items.length - 1].updatedAt,
//     } : null;

//     return { items, nextCursor };
// }


