import { db } from "@/db";
import { Subscriptions, users, videos, videosViews, videoUpdateSchema } from "@/db/schema";
import { z } from "zod";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, getTableColumns, exists } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { mux } from "@/lib/mux";
import { UploadThingError, UTApi } from "uploadthing/server";

export const subscriptionRouter = createTRPCRouter({

    create: protectedProcedure
        .input(z.object({
            userId: z.string()
        }))
        .mutation(async ({ ctx, input }) => {

            try {
                const { userId } = input;
                //console.log(ctx.user)

                if (userId === ctx.user.id) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot subscribe to yourself" });

                }


                const [creaatedSubscripion] = await db.insert(Subscriptions)
                    .values({
                        viewerId: ctx.user.id,
                        creatorId: userId,
                    }).returning()

                return creaatedSubscripion;


            }
            catch (error) {
                throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `${error}` });
            }
        }),

         remove: protectedProcedure
        .input(z.object({
            userId: z.string()
        }))
        .mutation(async ({ ctx, input }) => {

            try {
                const { userId } = input;
                //console.log(ctx.user)

                if (userId === ctx.user.id) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot subscribe to yourself" });

                }


                const [deletedSubscripion] = await db.delete(Subscriptions)
                    .where(and(
                        eq(Subscriptions.viewerId, ctx.user.id),
                        eq(Subscriptions.creatorId, userId)
                    ))
                    .returning()

                return deletedSubscripion;


            }
            catch (error) {
                throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `${error}` });
            }
        }),
// Add this inside your subscriptionsRouter = createTRPCRouter({ ... })

getMany: protectedProcedure
  .query(async ({ ctx }) => {
    const {id: clerkUserId} = ctx.user;

    if (!clerkUserId) {
      return []
    }

  
    const data = await db
      .select({
        ...getTableColumns(Subscriptions),
        user: users,
      })
      .from(Subscriptions)
      .innerJoin(users, eq(Subscriptions.creatorId, users.id))
      .where(eq(Subscriptions.viewerId, clerkUserId))
      .orderBy(desc(Subscriptions.createdAt)) // Most recently subscribed first
      .limit(20); // YouTube usually shows ~7-10, but we fetch more for safety

    return  data;
  }),
});