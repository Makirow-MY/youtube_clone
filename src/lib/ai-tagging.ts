// lib/ai-tagging.ts
import { db } from "@/db";
import { audienceSegments, comments, userTopicPreferences, users, videoAudiences, videoTags, videoTopics, videos, videosReactions, videosViews } from "@/db/schema";
import { eq, and, sql,  inArray, getTableColumns } from "drizzle-orm";
import { keywordCategories } from "./keyword";
import { VideoGetOneOutput } from "@/modules/videos/types";

interface TagExtractionResult {
    tags: Array<{ name: string; confidence: number }>;
    topics: Array<{ name: string; confidence: number }>;
}
interface AudienceAnalysisInput {
    videoId: string;
    video: any; // Or use proper Video type
}
// Simplified AI tagging using text analysis
export class VideoTaggingService {
    
    // Extract keywords from title and description
    async extractTagsFromMetadata(title: string, description: string): Promise<TagExtractionResult> {
        const text = `${title} ${description}`.toLowerCase();
        
console.log("Extracting tags from text:", text)
        
        const detectedTags = new Map<string, number>();
        const detectedTopics = new Map<string, number>();
        
        // Detect tags based on keywords
        for (const [topic, keywords] of Object.entries(keywordCategories)) {
            let maxConfidence = 0;
            
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    const confidence = this.calculateConfidence(keyword, text, title);
                    maxConfidence = Math.max(maxConfidence, confidence);
                    
                    // Add specific keyword as tag
                    detectedTags.set(keyword, Math.max(detectedTags.get(keyword) || 0, confidence));
                }
            }
            
            if (maxConfidence > 0.3) {
                detectedTopics.set(topic, maxConfidence);
            }
        }
        
        // Extract hashtags from description
        const hashtagRegex = /#(\w+)/g;
        let match;
        while ((match = hashtagRegex.exec(description)) !== null) {
            detectedTags.set(match[1], 0.9);
        }
        
        // Convert to arrays
        const tags = Array.from(detectedTags.entries())
            .map(([name, confidence]) => ({ name, confidence }))
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 15); // Limit tags
        
        const topics = Array.from(detectedTopics.entries())
            .map(([name, confidence]) => ({ name, confidence }))
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 8); // Limit topics
        
        return { tags, topics };
    }
    
    private calculateConfidence(keyword: string, text: string, title: string): number {
        // Higher confidence if keyword appears in title
        const inTitle = title.toLowerCase().includes(keyword) ? 0.3 : 0;
        
        // Count occurrences
        const regex = new RegExp(keyword, 'gi');
        const occurrences = (text.match(regex) || []).length;
        const occurrenceScore = Math.min(occurrences / 5, 0.5); // Max 0.5
        
        // Base confidence
        const baseConfidence = 0.2;
        
        return Math.min(baseConfidence + inTitle + occurrenceScore, 1.0);
    }
    
    // Save tags to database
    async saveTags(videoId: string, tags: Array<{ name: string; confidence: number }>) {
        // Delete existing tags
        await db.delete(videoTags).where(eq(videoTags.videoId, videoId));
        
        // Insert new tags
        for (const tag of tags) {
            await db.insert(videoTags).values({
                videoId,
                tagName: tag.name,
                confidence: tag.confidence,
                source: "ai_detected",
                weight: tag.confidence
            });
        }
    }
    
    // Save topics to database
    async saveTopics(videoId: string, topics: Array<{ name: string; confidence: number }>) {
        await db.delete(videoTopics).where(eq(videoTopics.videoId, videoId));
        
        for (const topic of topics) {
            await db.insert(videoTopics).values({
                videoId,
                topicName: topic.name,
                confidence: topic.confidence,
                source: "ai_detected"
            });
        }
    }
}

export class AudienceAnalysisService {

    async updateVideoAudiences({ videoId, video }: AudienceAnalysisInput) {
        try {
            console.log(`[Audience Analysis] Starting for video: ${videoId}`);

            // ====================== STEP 1: Get Rich Viewer Data ======================
            const viewers = await db
                .select({
                    userId: videosViews.userId,
                    viewedAt: videosViews.createdAt,
                    // Join reactions if available
                    liked: sql<boolean>`
            CASE 
                WHEN ${videosReactions.type} IS NOT NULL 
                THEN true 
                ELSE false 
            END
        `.as('liked'),
                    // Count comments as engagement signal
                    hasCommented: sql<boolean>`CASE WHEN COUNT(comments.id) > 0 THEN true ELSE false END`,
                })
                .from(videosViews)
                .leftJoin(videosReactions, and(
                    eq(videosReactions.videoId, videoId),
                    eq(videosReactions.userId, videosViews.userId)
                ))
                .leftJoin(comments, and(
                    eq(comments.videoId, videoId),
                    eq(comments.userId, videosViews.userId)
                ))
                .where(eq(videosViews.videoId, videoId))
                .groupBy(videosViews.userId, videosViews.createdAt, videosReactions.type);

            if (viewers.length < 15) {  // YouTube-like minimum threshold
                console.log(`[Audience Analysis] Only ${viewers.length} viewers. Skipping deep analysis.`);
                return;
            }

            const viewerIds = viewers.map(v => v.userId);
            console.log(`[Audience Analysis] Found ${viewers.length} engaged viewers`);

            // ====================== STEP 2: Get Rich Viewing History ======================
            const userHistory = await db
                .select({
                    userId: videosViews.userId,
                    videoId: videosViews.videoId,
                    viewedAt: videosViews.createdAt,
                    videoTitle: videos.title,
                    videoDescription: videos.description,
                    duration: videos.duration,
                })
                .from(videosViews)
                .innerJoin(videos, eq(videosViews.videoId, videos.id))
                .where(and(
                    inArray(videosViews.userId, viewerIds),
                    sql`${videosViews.videoId} != ${videoId}`
                ))
                .orderBy(sql`${videosViews.createdAt} DESC`)
                .limit(500); // Prevent explosion on very active users

            if (userHistory.length === 0) {
                console.log(`[Audience Analysis] No historical data found.`);
                return;
            }

            const relatedVideoIds = [...new Set(userHistory.map(h => h.videoId))];

            // ====================== STEP 3: Fetch Tags & Topics ======================
            const [allTags, allTopics] = await Promise.all([
                // Tags
                db.select({
                    videoId: videoTags.videoId,
                    tagName: videoTags.tagName,
                    confidence: videoTags.confidence,
                })
                .from(videoTags)
                .where(inArray(videoTags.videoId, relatedVideoIds)),

                // Topics - Fixed and improved
                db.select({
                    videoId: videoTopics.videoId,
                    topicName: videoTopics.topicName,
                    confidence: videoTopics.confidence,
                })
                .from(videoTopics)
                .where(inArray(videoTopics.videoId, relatedVideoIds))
            ]);

            // ====================== STEP 4: Advanced Pattern Analysis ======================
            const topicScores = this.calculateTopicScores(allTopics, userHistory, viewers);
            const tagScores = this.calculateTagScores(allTags, userHistory); // Can be used later

            const topTopics = topicScores
                .sort((a, b) => b.finalScore - a.finalScore)
                .slice(0, 10); // Top 8 topics

            console.log(`[Audience Analysis] Top topics found:`, topTopics.map(t => t.name));

            // ====================== STEP 5: Update Audience Segments ======================
            await this.updateAudienceSegments(videoId, topTopics, viewers.length);

            // ====================== STEP 6: Update User Topic Preferences ======================
            await this.updateUserTopicPreferences(viewerIds, allTopics, userHistory);

            console.log(`[Audience Analysis] Successfully completed for video ${videoId}`);

        } catch (error) {
            console.error("[Audience Analysis] Critical error:", error);
            // Fail silently so video upload/tagging doesn't break
        }
    }

    // ====================== HELPER METHODS ======================

    private calculateTopicScores(
        allTopics: any[],
        userHistory: any[],
        viewers: any[]
    ) {
        const topicMap = new Map<string, {
            count: number;
            totalConfidence: number;
            recentCount: number;
            engagedUsers: Set<string>;
        }>();

        const now = Date.now();

        for (const topic of allTopics) {
            const entry = topicMap.get(topic.topicName) || {
                count: 0,
                totalConfidence: 0,
                recentCount: 0,
                engagedUsers: new Set()
            };

            entry.count++;
            entry.totalConfidence += (topic.confidence || 0.5);

            // Recency boost (views in last 30 days get more weight)
            const relatedHistory = userHistory.filter(h => h.videoId === topic.videoId);
            for (const hist of relatedHistory) {
                const daysOld = (now - new Date(hist.viewedAt).getTime()) / (1000 * 3600 * 24);
                if (daysOld < 30) entry.recentCount++;
            }

            topicMap.set(topic.topicName, entry);
        }

        return Array.from(topicMap.entries()).map(([name, data]) => {
            const avgConfidence = data.totalConfidence / data.count;
            const frequency = data.count / userHistory.length;
            const recencyFactor = Math.min(1 + (data.recentCount / Math.max(data.count, 1)) * 0.6, 1.8);

            return {
                name,
                count: data.count,
                avgConfidence,
                finalScore: frequency * avgConfidence * recencyFactor
            };
        });
    }

    private calculateTagScores(allTags: any[], userHistory: any[]) {
                const topicMap = new Map<string, {
            count: number;
            totalConfidence: number;
            recentCount: number;
            engagedUsers: Set<string>;
        }>();

        const now = Date.now();

        for (const topic of allTags) {
            const entry = topicMap.get(topic.tagName) || {
                count: 0,
                totalConfidence: 0,
                recentCount: 0,
                engagedUsers: new Set()
            };

            entry.count++;
            entry.totalConfidence += (topic.confidence || 0.5);

            // Recency boost (views in last 30 days get more weight)
            const relatedHistory = userHistory.filter(h => h.videoId === topic.videoId);
            for (const hist of relatedHistory) {
                const daysOld = (now - new Date(hist.viewedAt).getTime()) / (1000 * 3600 * 24);
                if (daysOld < 30) entry.recentCount++;
            }

            topicMap.set(topic.tagName, entry);
        }

        return Array.from(topicMap.entries()).map(([name, data]) => {
            const avgConfidence = data.totalConfidence / data.count;
            const frequency = data.count / userHistory.length;
            const recencyFactor = Math.min(1 + (data.recentCount / Math.max(data.count, 1)) * 0.6, 1.8);

            return {
                name,
                count: data.count,
                avgConfidence,
                finalScore: frequency * avgConfidence * recencyFactor
            };
        });

       // return [];
    }

    private async updateAudienceSegments(
        videoId: string,
        topTopics: any[],
        totalViewers: number
    ) {
        for (const topic of topTopics) {
            const engagementScore = Math.min(
                (topic.count / totalViewers) * topic.avgConfidence * 1.2, 
                1.0
            );

            if (engagementScore < 0.12) continue;

            // Find or create segment
            let [segment] = await db
                .select()
                .from(audienceSegments)
                .where(eq(audienceSegments.segmentName, topic.name))
                .limit(1);

            if (!segment) {
                [segment] = await db
                    .insert(audienceSegments)
                    .values({
                        segmentName: topic.name,
                        description: `Users highly interested in ${topic.name}`,
                        criteria: {
                            primaryTopic: topic.name,
                            minEngagement: engagementScore,
                            source: "audience_derived"
                        }
                    })
                    .returning();
            }

            if (segment) {
                await db
                    .insert(videoAudiences)
                    .values({
                        videoId,
                        segmentId: segment.id,
                        engagementScore: Number(engagementScore.toFixed(3)),
                        viewerCount: topic.count,
                        updatedAt: new Date()
                    })
                    .onConflictDoUpdate({
                        target: [videoAudiences.videoId, videoAudiences.segmentId],
                        set: {
                            engagementScore: Number(engagementScore.toFixed(3)),
                            viewerCount: topic.count,
                            updatedAt: new Date()
                        }
                    });

                console.log(`[Audience] Updated segment "${topic.name}" → Score: ${engagementScore.toFixed(3)}`);
            }
        }
    }

    private async updateUserTopicPreferences(
        userIds: string[],
        allTopics: any[],
        userHistory: any[]
    ) {
        const now = new Date();

        for (const userId of userIds) {
            const userViewedTopics = allTopics.filter(t => 
                userHistory.some(h => h.videoId === t.videoId && h.userId === userId)
            );

            for (const topic of userViewedTopics) {
                await db
                    .insert(userTopicPreferences)
                    .values({
                        userId,
                        topicName: topic.topicName,
                        affinity: Math.min((topic.confidence || 0.5) * 1.1, 1.0),
                        lastUpdated: now
                    })
                    .onConflictDoUpdate({
                        target: [userTopicPreferences.userId, userTopicPreferences.topicName],
                        set: {
                            // Smart averaging with recency bias
                            affinity: sql`LEAST(1.0, (${userTopicPreferences.affinity} * 0.7 + ${topic.confidence || 0.5} * 1.1) / 1.8)`,
                            lastUpdated: now
                        }
                    });
            }
        }
    }
}

// export class AudienceAnalysisService {
    
//     // Update audience segments based on viewing patterns
//      async updateVideoAudiences({ videoId, video }: AudienceAnalysisInput) {
//             try {
//                 console.log(`Analyzing audience for video: ${videoId}`);
                
//                 // Step 1: Get viewers of this video
//                 const viewers = await db
//                     .select({
//                         ...getTableColumns(videosViews),
//                    liked: videosReactions.type,
//                     // Count comments as engagement signal
//                     hasCommented: sql<boolean>`CASE WHEN COUNT(comments.id) > 0 THEN true ELSE false END`,
//                     })
//                     .from(videosViews)
//                 .leftJoin(videosReactions, and(
//                     eq(videosReactions.videoId, videoId),
//                     eq(videosReactions.userId, videosViews.userId)
//                 ))
//                 .leftJoin(comments, and(
//                     eq(comments.videoId, videoId),
//                     eq(comments.userId, videosViews.userId)
//                 ))
//                 .where(eq(videosViews.videoId, videoId))
//                 .groupBy(videosViews.userId, videosViews.createdAt, videosReactions.type);
                
//                 if (viewers.length === 0) {
//                     console.log(`No viewers found for video ${videoId}, skipping audience analysis`);
//                     return;
//                 }
                
//                 const viewerIds = viewers.map(v => v.userId);
//            //     console.log(`Found ${viewerIds.length} unique viewers`);
                
//                 // Step 2: Get viewing history for these users
//                 const userHistory = await db
//                     .select({
//                         userId: videosViews.userId,
//                         videoId: videosViews.videoId,
//                         videoTitle: videos.title,
//                         duration: videos.duration,
//                         viewedAt: videosViews.createdAt,
//                         videoDescription: videos.description,
//                     })
//                .from(videosViews)
//                 .innerJoin(videos, eq(videosViews.videoId, videos.id))
//                 .where(and(
//                     inArray(videosViews.userId, viewerIds),
//                     sql`${videosViews.videoId} != ${videoId}`
//                 ))
//                 .orderBy(sql`${videosViews.createdAt} DESC`)
//                 .limit(500);
//                   //  .where(sql`${videosViews.videoId} != ${videoId}`); // Exclude current video
                
//                 if (userHistory.length === 0) {
//                     console.log(`No viewing history found for users of video ${videoId}`);
//                     return;
//                 }
                
//                 // Step 3: Get tags and topics for these videos
//                 const videoIds = [...new Set(userHistory.map(v => v.videoId))];
                
//                 // Fetch tags for all related videos
//                 const allTags = await db
//                     .select({
//                         videoId: videoTags.videoId,
//                         tagName: videoTags.tagName,
//                         confidence: videoTags.confidence
//                     })
//                     .from(videoTags)
//                     .where(inArray(videoTags.videoId, videoIds));
//                   const AllVideos = db.$with("viewer_reactions").as(
//                         db.select({
//                             userId: users.id,
//                             videoId: videos.id,
//                         }).from(videos)
//                             .where(inArray(videos.userId, video.userId ? [video.userId] : []))
//                     );
//                 // Fetch topics for all related videos
//                 const allTopics = await db
//                 .with(AllVideos)
//                     .select({
//                         videoId: videoTopics.videoId,
//                         topicName: videoTopics.topicName,
//                         confidence: videoTopics.confidence,
//                         userId: AllVideos.userId,
//                     })
//                     .from(videoTopics)
//                      .leftJoin(AllVideos, eq(AllVideos.videoId, videoTopics.videoId))
//                     .where(inArray(videoTopics.videoId, videoIds))
                    
//                     ;
                
//                 // Step 4: Analyze patterns - count occurrences of tags/topics
//                 const topicCounts = new Map<string, { count: number; totalConfidence: number }>();
//                 const tagCounts = new Map<string, { count: number; totalConfidence: number }>();
                
//                 for (const topic of allTopics) {
//                     const existing = topicCounts.get(topic.topicName) || { count: 0, totalConfidence: 0 };
//                     topicCounts.set(topic.topicName, {
//                         count: existing.count + 1,
//                         totalConfidence: existing.totalConfidence + (topic.confidence || 0.5)
//                     });
//                 }
                
//                 for (const tag of allTags) {
//                     const existing = tagCounts.get(tag.tagName) || { count: 0, totalConfidence: 0 };
//                     tagCounts.set(tag.tagName, {
//                         count: existing.count + 1,
//                         totalConfidence: existing.totalConfidence + (tag.confidence || 0.5)
//                     });
//                 }
                
//                 // Step 5: Find top topics (using both count and confidence)
//                 const topTopics = Array.from(topicCounts.entries())
//                     .map(([name, data]) => ({
//                         name,
//                         count: data.count,
//                         avgConfidence: data.totalConfidence / data.count,
//                         score: (data.count / userHistory.length) * (data.totalConfidence / data.count)
//                     }))
//                     .sort((a, b) => b.score - a.score)
//                     .slice(0, 5);
                
//                 // Step 6: Update audience segments and mapping
//                 for (const topic of topTopics) {
//                     const engagementScore = Math.min(topic.count / userHistory.length, 1.0);
                    
//                     if (engagementScore < 0.1) continue; // Skip low engagement topics
                    
//                     // Check if audience segment exists
//                     let [segment] = await db
//                         .select()
//                         .from(audienceSegments)
//                         .where(eq(audienceSegments.segmentName, topic.name))
//                         .limit(1);
                    
//                     if (!segment) {
//                         // Create new segment
//                         const [newSegment] = await db
//                             .insert(audienceSegments)
//                             .values({
//                                 segmentName: topic.name,
//                                 description: `Audience interested in ${topic.name}`,
//                                 criteria: { 
//                                     primaryTopic: topic.name,
//                                 }
//                             })
//                             .returning();
//                         segment = newSegment;
//                     }
                    
//                     if (segment) {
//                         // Upsert video-audience mapping
//                         await db
//                             .insert(videoAudiences)
//                             .values({
//                                 videoId,
//                                 segmentId: segment.id,
//                                 engagementScore,
//                                 viewerCount: topic.count,
//                                 updatedAt: new Date()
//                             })
//                             .onConflictDoUpdate({
//                                 target: [videoAudiences.videoId, videoAudiences.segmentId],
//                                 set: {
//                                     engagementScore,
//                                     viewerCount: topic.count,
//                                     updatedAt: new Date()
//                                 }
//                             });
                        
//                         console.log(`Updated audience segment "${topic.name}" for video ${videoId} with score ${engagementScore}`);
//                     }
//                 }
                
//                 // Also update user topic preferences (bonus feature)
//                  for (const userId of viewerIds) {
//                 const userTopics = allTopics.filter(t => t.userId === userId); // Need user mapping
//                 for (const topic of userTopics) {
//                     await db
//                         .insert(userTopicPreferences)
//                         .values({
//                             userId,
//                             topicName: topic.topicName,
//                             affinity: topic.confidence,
//                             lastUpdated: new Date()
//                         })
//                         .onConflictDoUpdate({
//                             target: [userTopicPreferences.userId, userTopicPreferences.topicName],
//                             set: {
//                                 affinity: sql`(${userTopicPreferences.affinity} + ${topic.confidence}) / 2`,
//                                 lastUpdated: new Date()
//                             }
//                         });
//                 }
//             }

//               //  await this.updateUserTopicPreferences(viewerIds, allTopics);
                
//                 console.log(`Successfully analyzed audience for video ${videoId}`);
                
//             } catch (error) {
//                 console.error("Error in AudienceAnalysisService:", error);
//                 // Don't throw - let the main operation continue
//                 // The tagging still succeeded even if audience analysis fails
//             }
//         }

//          private async updateUserTopicPreferences(
//         userIds: string[], 
//         topics: Array<{ videoId: string; topicName: string; confidence: number, userId: string }>
//     ) {
//         try {
//             // This would require a userTopicPreferences table
//             // For now, just log that it would happen
//             console.log(`Would update preferences for ${userIds.length} users based on ${topics.length} topics`);
            
//             // Implementation example (if you have userTopicPreferences table):
            
//             for (const userId of userIds) {
//                 const userTopics = topics.filter(t => t.userId === userId);
//                 for (const topic of userTopics) {
//                     await db
//                         .insert(userTopicPreferences)
//                         .values({
//                             userId,
//                             topicName: topic.topicName,
//                             affinity: topic.confidence,
//                             lastUpdated: new Date()
//                         })
//                         .onConflictDoUpdate({
//                             target: [userTopicPreferences.userId, userTopicPreferences.topicName],
//                             set: {
//                                 affinity: sql`(${userTopicPreferences.affinity} + ${topic.confidence}) / 2`,
//                                 lastUpdated: new Date()
//                             }
//                         });
//                 }
//             }
            
//         } catch (error) {
//             console.error("Error updating user preferences:", error);
//         }
//     }
// }

// Audience analysis service
// export class AudienceAnalysisService {
    
//     // Update audience segments based on viewing patterns
//     async updateVideoAudiences(videoId: string) {
//         // Get viewers of this video
//         const viewers = await db.query.videosViews.findMany({
//             where: eq(videosViews.videoId, videoId),
//             with: {
//                 users: true
//             }
//         });
        
//         // Get viewing history for these users
//         const userHistory = await db.query.videosViews.findMany({
//             where: inArray(videosViews.userId, viewers.map(v => v.userId)),
            
//         });
        
//         // Analyze common patterns
//         const topicCounts = new Map<string, number>();
//         const tagCounts = new Map<string, number>();
        
//         for (const view of userHistory) {
//             for (const topic of view.videos?.topics || []) {
//                 topicCounts.set(topic.topicName, (topicCounts.get(topic.topicName) || 0) + 1);
//             }
//             for (const tag of view.videos?.tags || []) {
//                 tagCounts.set(tag.tagName, (tagCounts.get(tag.tagName) || 0) + 1);
//             }
//         }
        
//         // Find top topics that represent audience interests
//         const topTopics = Array.from(topicCounts.entries())
//             .sort((a, b) => b[1] - a[1])
//             .slice(0, 5);
        
//         // Update audience segments for this video
//         for (const [topicName, count] of topTopics) {
//             const engagementScore = count / userHistory.length;
            
//             // Check if audience segment exists
//             let segment = await db.query.audienceSegments.findFirst({
//                 where: eq(audienceSegments.segmentName, topicName)
//             });
            
//             if (!segment) {
//                 [segment] = await db.insert(audienceSegments).values({
//                     segmentName: topicName,
//                     criteria: { primaryTopic: topicName }
//                 }).returning();
//             }
            
//             // Update video-audience mapping
//             await db.insert(videoAudiences).values({
//                 videoId,
//                 segmentId: segment.id,
//                 engagementScore,
//                 viewerCount: count
//             }).onConflictDoUpdate({
//                 target: [videoAudiences.videoId, videoAudiences.segmentId],
//                 set: {
//                     engagementScore,
//                     viewerCount: count,
//                     updatedAt: new Date()
//                 }
//             });
//         }
//     }
// }