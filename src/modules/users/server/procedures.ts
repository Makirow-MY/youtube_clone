import { db } from "@/db";
import { playLists, playListsVideos, Subscriptions, users, videos, videosReactions, videosViews, videoTags, videoTopics } from "@/db/schema";
import { z } from "zod";
import { createTRPCRouter, baseProcedure, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, getTableColumns, not, sql, inArray, isNotNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
getOne: baseProcedure
    .input(
      z.object({
        userId: z.string().nullish(),
        })
    )
    .query(async ({ ctx, input }) => {

      const { userId} = input;
      const {clerkUserId} = ctx;
   let user;
    let userVideos;

 if (userId){
    const [userData] =  await db.select().from(users)
   .where( eq(users.clerkId, userId ) )

   if (!userData) {
    user = null;

   }
   else{
     const viewerReactions = db.$with("viewer_reactions").as(
                    db.select({
                        videoId: videosReactions.videoId,
                        type: videosReactions.type,
                    }).from(videosReactions)
                        .where(inArray(videosReactions.userId, [userData.id]))
                );

     const viewerSubscription = db.$with("viewer_subscription").as(
                        db.select().from(Subscriptions)
                            .where(inArray(Subscriptions.viewerId, [userData.id]))
                    );
    
                const viewCountSub = db.$count(videosViews, eq(videosViews.videoId, videos.id));
    
     const userInfor =  await db
                    .with(viewerSubscription).select({
                        ...getTableColumns(users),
                            subscriberCount: db.$count(Subscriptions, eq(Subscriptions.creatorId, users.id)),
                            videoCount: db.$count(videos, eq(videos.userId, users.id)),
                            viewerSubscribed: isNotNull(viewerSubscription.viewerId).mapWith(Boolean)
                                           
                    })
                    .from(users)
    .leftJoin(viewerSubscription, eq(viewerSubscription.creatorId, users.id))
   .where( eq(users.clerkId, userId ) )
 

   user =  userInfor 

      const existingVid = await db
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
                       eq(videos.userId, userData.id),
                     userId !== clerkUserId ?  eq(videos.videoVisibility, 'public') : undefined,
                   ))


                   userVideos = existingVid
   
                }

   }
      
   if (!user) {
    throw new TRPCError({ code: "NOT_FOUND" });
   }

  // console.log("all detail page user", user)
    
   return {
    user: user,
    videos: userVideos,
    }

    }),

})