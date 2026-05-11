import { db } from "@/db";
import { playLists, playListsVideos, users, videos, videosReactions, videosViews, videoTags, videoTopics } from "@/db/schema";
import { z } from "zod";
import { createTRPCRouter, baseProcedure, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, getTableColumns, not, sql, inArray } from "drizzle-orm";
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

   if (clerkUserId && !userId) {
    const [userData] = await db.select().from(users)
   .where( eq(users.clerkId, clerkUserId) )
 if (!userData) user = null;
 
   user =  userData

   }
   else if (userId){
    const [userData] = await db.select().from(users)
   .where( eq(users.clerkId, userId ) )
 if (!userData) user = null;

   user =  userData

   }
      
   if (!user) {
    throw new TRPCError({ code: "NOT_FOUND" });
   }

   console.log("all detail page user", user)
    
   return {
    user: user,
    }

    }),

})