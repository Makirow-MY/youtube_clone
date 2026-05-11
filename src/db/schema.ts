import { pgTable, text, uuid, timestamp, uniqueIndex, integer, pgEnum, primaryKey, foreignKey, boolean, index, real, jsonb } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"


const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").unique().notNull(),
    name: text("name").notNull(),
    imageUrl: text("image_url").notNull(),
    bannerUrl: text("banner_url"),
    bannerKey: text("banner_key"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

}, (t) => [uniqueIndex("clerk_id_idx").on(t.clerkId)])

export const userRelations = relations(users, ({ many }) => ({
    videos: many(videos),
    videoViews: many(videosViews),
    videoReactions: many(videosReactions),
    playLists: many(playLists),
    subscriptions: many(Subscriptions, {
        relationName: "subscriptionsAsViewer"
    }),
    subscribers: many(Subscriptions, {
        relationName: "creator_subscriptions"
    }),
    comments: many(comments),
    commentReactions: many(commentsReactions),
}));

const videoVisibility = pgEnum("visibility", [
    "private",
    "public"
]);
export const videotype = pgEnum("videotype", [
    "video",
    "short"
]);
const videos = pgTable("videos", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    downloadUrl: text("download_url"),
    thumbnailUrl: text("thumbnail_url"),
    thumbnailKey: text("thumbnail_key"),
    previewUrl: text("preview_url"),
    previewKey: text("preview_key"),
    videoType: videotype("is_short").default("video").notNull(),
    duration: integer("duration").default(0).notNull(),
    muxStatus: text("mux_status"),
    videoVisibility: videoVisibility('visibility').default("private").notNull(),
    muxAssetId: text("mux_asset_id").unique(),
    muxUploadId: text("mux_upload_id").unique(),
    muxPlaybakId: text("mux_playback_id").unique(),
    muxTrackId: text("mux_track_id").unique(),
    muxTrackStatus: text("mux_track_status"),
    userId: uuid("user_id").references(() => users.id, {
        onDelete: "cascade",
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

});

const playLists = pgTable("playlists", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    userId: uuid("user_id").references(() => users.id, {
        onDelete: "cascade",
    }).notNull(),
    description: text("description"),
    videoVisibility: videoVisibility('visibility').default("public").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

})
const playListsVideos = pgTable("playlists_videos", {
    id: uuid("id").defaultRandom(),
    playListId: uuid("playlists__id").references(() => playLists.id, {
        onDelete: "cascade",
    }).notNull(),
    videoId: uuid("videos__id").references(() => videos.id, {
        onDelete: "cascade",
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

}, (t) => [primaryKey({
    name: "videos_playlist_pk",
    columns: [t.playListId, t.videoId]
})]
)


export const playlistVideoRelations = relations(playListsVideos, ({ one, many }) => ({
    videos: one(videos, {
        fields: [playListsVideos.videoId],
        references: [videos.id],
    }),
    playlist: one(playLists, {
        fields: [playListsVideos.playListId],
        references: [playLists.id],
    }),

}));
export const playlistRelations = relations(playLists, ({ one, many }) => ({
    users: one(users, {
        fields: [playLists.userId],
        references: [users.id],
    }),

    playListsVideos: many(playListsVideos)
}));
export const videoInsertSchema = createInsertSchema(videos)
export const videoUpdateSchema = createUpdateSchema(videos)
export const videoSelectSchema = createSelectSchema(videos)


export const videoRelations = relations(videos, ({ one, many }) => ({
    user: one(users, {
        fields: [videos.userId],
        references: [users.id],
    }),
    views: many(videosViews),
    playListsVideos: many(playListsVideos),
    reactions: many(videosReactions),
    comments: many(comments),
}));

const videosViews = pgTable("videos_views", {
    id: uuid("id").defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
        onDelete: "cascade",
    }).notNull(),
    videoId: uuid("video_id").references(() => videos.id, {
        onDelete: "cascade",
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

}, (t) => [primaryKey({
    name: "videos_views_pk",
    columns: [t.userId, t.videoId]
})
])



 const comments = pgTable("comments", {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id"),
    userId: uuid("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    videoId: uuid("video_id")
        .references(() => videos.id, { onDelete: "cascade" })
        .notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
    parentForeignKey: foreignKey({
        columns: [t.parentId],
        foreignColumns: [t.id],
        name: "comments_parent_id_fkey"
    }).onDelete("cascade")
}));

export const commentRelations = relations(comments, ({ one, many }) => ({
    user: one(users, {
        fields: [comments.userId],
        references: [users.id],
    }),
    video: one(videos, {
        fields: [comments.videoId],
        references: [videos.id],
    }),
    parent: one(comments, {
        fields: [comments.parentId],
        references: [comments.id],
        relationName: "comment_parent",
    }),
    reactions: many(commentsReactions),
    replies: many(comments, {
        relationName: "comment_parent",
    }),
}));

export const commentInsertSchema = createInsertSchema(comments);
export const commentUpdateSchema = createUpdateSchema(comments);
export const commentSelectSchema = createSelectSchema(comments);




export const viewRelations = relations(videosViews, ({ one }) => ({
    users: one(users, {
        fields: [videosViews.userId],
        references: [users.id],
    }),
    videos: one(videos, {
        fields: [videosViews.videoId],
        references: [videos.id],
    }),
}));

export const videoViewsInsertSchema = createInsertSchema(videosViews)
export const videoViewsUpdateSchema = createUpdateSchema(videosViews)
export const videoViewsSelectSchema = createSelectSchema(videosViews)



const Subscriptions = pgTable("subscriptions", {
    id: uuid("id").defaultRandom(),
    viewerId: uuid("viewer_id").references(() => users.id, {
        onDelete: "cascade",
    }).notNull(),
    creatorId: uuid("creator_id").references(() => users.id, {
        onDelete: "cascade",
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

}, (t) => [primaryKey({
    name: "subscriptions_pk",
    columns: [t.viewerId, t.creatorId]
})
]
)

export const subscriptionRelations = relations(Subscriptions, ({ one }) => ({
    viewer: one(users, {
        fields: [Subscriptions.viewerId],
        references: [users.id],
        relationName: "subscriptionsAsViewer"
    }),
    creator: one(users, {
        fields: [Subscriptions.creatorId],
        references: [users.id],
        relationName: "creator_subscriptions"
    }),
}));



export const reactionType = pgEnum("reaction_type", [
    "like",
    "dislike"
]);

const videosReactions = pgTable("videos_reactions", {
    id: uuid("id").defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
        onDelete: "cascade",
    }).notNull(),
    videoId: uuid("video_id").references(() => videos.id, {
        onDelete: "cascade",
    }).notNull(),
    type: reactionType("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

}, (t) => [primaryKey({
    name: "videos_reactios_pk",
    columns: [t.userId, t.videoId]
})
])


export const reactionRelations = relations(videosReactions, ({ one }) => ({
    users: one(users, {
        fields: [videosReactions.userId],
        references: [users.id],
    }),
    videos: one(videos, {
        fields: [videosReactions.videoId],
        references: [videos.id],
    }),
}));

export const videoReactionsInsertSchema = createInsertSchema(videosReactions)
export const videoReactionsUpdateSchema = createUpdateSchema(videosReactions)
export const videoReactionsSelectSchema = createSelectSchema(videosReactions)

const commentsReactions = pgTable("comments_reactions", {
    userId: uuid("user_id").references(() => users.id, {
        onDelete: "cascade",
    }).notNull(),
    commentId: uuid("comment_id").references(() => comments.id, {
        onDelete: "cascade",
    }).notNull(),
    type: reactionType("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

}, (t) => [primaryKey({
    name: "comments_reactions_pk",
    columns: [t.userId, t.commentId]
})
])


export const commentReactionsRelations = relations(commentsReactions, ({ one }) => ({
    users: one(users, {
        fields: [commentsReactions.userId],
        references: [users.id],
    }),
    comments: one(comments, {
        fields: [commentsReactions.commentId],
        references: [comments.id],
    }),
}));
export const commentsReactionsInsertSchema = createInsertSchema(commentsReactions)
export const commentsReactionsUpdateSchema = createUpdateSchema(commentsReactions)
export const commentsReactionsSelectSchema = createSelectSchema(commentsReactions)




export const confidenceLevel = pgEnum("confidence_level", [
    "high",
    "medium",
    "low"
])

export const sourceType = pgEnum("source_type", [
    "ai_detected",
    "user_selected",
    "system_inferred",
    "audience_derived"
])

// Video Tags table - dynamic tags extracted from content
export const videoTags = pgTable("video_tags", {
    id: uuid("id").primaryKey().defaultRandom(),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
    tagName: text("tag_name").notNull(),
    confidence: real("confidence").default(0.5), // How confident AI is about this tag
    source: sourceType("source").default("ai_detected"),
    weight: real("weight").default(1.0), // For ranking/importance
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
    uniqueIndex("video_tag_unique_idx").on(t.videoId, t.tagName),
    index("tag_name_idx").on(t.tagName)
])

// Video Topics - broader categories derived from tags
export const videoTopics = pgTable("video_topics", {
    id: uuid("id").primaryKey().defaultRandom(),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
    topicName: text("topic_name").notNull(),
    confidence: real("confidence").default(0.5),
    source: sourceType("source").default("ai_detected"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
    uniqueIndex("video_topic_unique_idx").on(t.videoId, t.topicName),
    index("topic_name_idx").on(t.topicName)
])

export const categoriesRelations = relations(videoTopics, ({ many }) => ({
    videos: many(videos),
}));
// Audience Segments - derived from who watches what
export const audienceSegments = pgTable("audience_segments", {
    id: uuid("id").primaryKey().defaultRandom(),
    segmentName: text("segment_name").notNull().unique(),
    description: text("description"),
    criteria: jsonb("criteria"), // JSON criteria for segment matching
    createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Video-Audience mapping - which audiences like this video
export const videoAudiences = pgTable("video_audiences", {
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
    segmentId: uuid("segment_id").references(() => audienceSegments.id, { onDelete: "cascade" }).notNull(),
    engagementScore: real("engagement_score").default(0),
    viewerCount: integer("viewer_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
    primaryKey({ columns: [t.videoId, t.segmentId] })
])

// User topic preferences (for personalization)
export const userTopicPreferences = pgTable("user_topic_preferences", {
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    topicName: text("topic_name").notNull(),
    affinity: real("affinity").default(0.5), // 0-1 score
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
}, (t) => [
    primaryKey({ columns: [t.userId, t.topicName] }),
    index("user_topic_idx").on(t.userId, t.topicName)
])

export { users, playListsVideos, videos, playLists, comments, commentsReactions, videoVisibility, videosViews, videosReactions, Subscriptions };