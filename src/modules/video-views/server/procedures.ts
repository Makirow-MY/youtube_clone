import { db } from "@/db";
import { Subscriptions, users, userTopicPreferences, videos, videosReactions, videosViews, videoTopics, videoUpdateSchema } from "@/db/schema";
import { z } from "zod";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, getTableColumns, exists, isNotNull, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { mux } from "@/lib/mux";
import { UploadThingError, UTApi } from "uploadthing/server";
import { AudienceAnalysisService, VideoTaggingService } from "@/lib/ai-tagging";

export const videosViewsRouter = createTRPCRouter({

    create: protectedProcedure
        .input(z.object({
            videoId: z.string()
        }))
        .mutation(async ({ ctx, input }) => {

            try {
                const { id: userId } = ctx.user;
                const { videoId } = input;
                // // console.log(ctx.user)

                if (!userId) {
                    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing User Id, Try Signing In Again" });

                }

                if (!videoId) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Missing video Id, Try Signing In Again" });

                }

   const [exitingVideo] = await db.select().from(videos)
                    .where( eq(videos.id, videoId))

                const [exitingVideoViews] = await db.select().from(videosViews)
                    .where(and(
                        eq(videosViews.userId, userId),
                        eq(videosViews.videoId, videoId)
                    ))

                if (exitingVideoViews) {
                    return exitingVideoViews;
                }


                 const videoTopicsData1 = await db.select().from(videoTopics).where(
                    eq(videoTopics.videoId, videoId)
                );

                  if (videoTopicsData1.length === 0) {
                    const taggingService = new VideoTaggingService();
                                const { tags, topics } = await taggingService.extractTagsFromMetadata(
                                    exitingVideo.title,
                                    exitingVideo.description || ""
                                );
                    
                                const MyTopic = topics.slice(0, 4)
                                const MyTag = tags.slice(0, 4)
                                // Save tags and topics
                                await taggingService.saveTags(videoId, MyTag);
                                await taggingService.saveTopics(videoId, MyTopic);
       }
       
          const videoTopicsData = await db.select().from(videoTopics).where(
                    eq(videoTopics.videoId, videoId)
                );

                 let affinityBoost =  0.23;
              //  if (likedNum > 0) affinityBoost += 0.2;

 const topicCounts = new Map<string, { count: number; totalConfidence: number }>();
                
                
                            for (const topic of videoTopicsData) {
                                 const existing = topicCounts.get(topic.topicName) || { count: 0, totalConfidence: 0 };

                    topicCounts.set(topic.topicName, {
                        count: existing.count + 1,
                        totalConfidence: existing.totalConfidence + (topic.confidence || 0.5)
                    });

                const [existingPref] = await db.select().from(userTopicPreferences).where(
                    and(
                        eq(userTopicPreferences.userId, userId),
                        eq(userTopicPreferences.topicName, topic.topicName)
                    )
                );

                                const newAffinity = existingPref 
                    ? Math.min(existingPref?.affinity || 0 + affinityBoost, 1.0)
                    : Math.min(0.5 + affinityBoost, 1.0);
 
                    if (existingPref) {
                    await db.update(userTopicPreferences)
                        .set({ affinity: newAffinity, lastUpdated: new Date() })
                        .where(and(
                            eq(userTopicPreferences.userId, userId),
                            eq(userTopicPreferences.topicName, topic.topicName)
                        ));
                }
                else {
                    await db.insert(userTopicPreferences).values({
                        userId,
                        topicName: topic.topicName,                        
                        affinity: newAffinity
                    });
                }

            }
               
                const [newVideoView] = await db.insert(videosViews).values({
                    userId,
                    videoId,
                }).returning()
                  const audienceService = new AudienceAnalysisService();
                  await audienceService.updateVideoAudiences({ videoId: videoId, video: exitingVideo });
                
                return newVideoView;

            }
            catch (error) {
                throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `${error}` });
            }
        }),

});