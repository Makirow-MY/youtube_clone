import { db } from "@/db";
import { playLists, playListsVideos, users, videos, videosReactions, videosViews, videoTags, videoTopics } from "@/db/schema";
import { z } from "zod";
import { createTRPCRouter, baseProcedure, protectedProcedure } from "@/trpc/init";
import { eq, and, or, lt, desc, getTableColumns, not, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const suggestionsRouter = createTRPCRouter({

  getMany: baseProcedure
    .input(
      z.object({
        videoId: z.string(),
        playlistId: z.string().nullish(),
        cursor: z.object({ id: z.string(), updatedAt: z.date() }).nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ ctx, input }) => {

      const { cursor, limit, videoId, playlistId } = input;

      const [existingVideo] = await db
        .select({ id: videos.id, userId: videos.userId })
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!existingVideo) throw new TRPCError({ code: "NOT_FOUND" });



      const playlistAllVideos = db.$with("playList_Videos").
        as(
          db.select({
            videoId: playListsVideos.videoId,
            playlistId: playListsVideos.playListId,
          }).from(playListsVideos)
            .where(
              playlistId ? eq(playListsVideos.playListId, playlistId) : undefined
            )
        );
const [playlistItem] = await db.select({
  ...getTableColumns(playLists),
       videoCount: db.$count(playListsVideos,
            eq(playListsVideos.playListId, playLists.id),
          ),
}).from(playLists)
            .where(
              playlistId ? eq(playLists.id, playlistId) : undefined
            );
      const sourceTags = await db.select().from(videoTags).where(eq(videoTags.videoId, videoId));
      const sourceTopic = await db.select().from(videoTopics).where(eq(videoTopics.videoId, videoId));

      if (sourceTags.length === 0 || sourceTopic.length === 0) {
       // console.log("sourceTags", sourceTags, "sourceTopic", sourceTopic)
      }
      const tagNames = sourceTags.map(t => t.tagName);
      const topicNames = sourceTopic.map(t => t.topicName);
     // console.log({ sourceTags, sourceTopic })
      const data = await db
        .with(playlistAllVideos)
        .select({
          ...getTableColumns(videos),
          playlistId: playlistAllVideos.playlistId,
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
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .leftJoin(playlistAllVideos, eq(videos.id, playlistAllVideos.videoId))
        .where(
          and(
            !playlistId ? not(eq(videos.id, videoId)) : undefined,
            eq(videos.videoVisibility, "public"),
            eq(videos.videoType, "video"),
              cursor
              ? or(
                lt(videos.updatedAt, cursor.updatedAt),
                and(eq(videos.updatedAt, cursor.updatedAt), lt(videos.id, cursor.id))
              )
              : undefined
          )
        )
        .orderBy(
          desc(sql`RANDOM()`),


        )
        .limit(limit + 1);
     // console.log({ data })
      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1).sort(() => Math.random() - 0.5) : data.sort(() => Math.random() - 0.5);

      const nextCursor = hasMore
        ? { id: items[items.length - 1].id, updatedAt: items[items.length - 1].updatedAt }
        : null;

      return {
        items,
        playlist: playlistId ?  playlistItem : null,
        nextCursor
      };
    }),
})