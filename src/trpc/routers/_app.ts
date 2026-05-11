//import { CategoriesRouter } from '@/modules/categories/server/procedures';
import { CategoriesRouter } from '@/modules/categories/server/procedures';
import { protectedProcedure, createTRPCRouter } from '../init';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videosRouter } from '@/modules/videos/server/procedures';
import { videosViewsRouter } from '@/modules/video-views/server/procedures';
import { videosReactionsRouter } from '@/modules/video-reactions/server/procedures';
import { subscriptionRouter } from '@/modules/subscription/server/procedures';
import { commentsRouter } from '@/modules/comments/server/procedures';
import { commentReactionsRouter } from '@/modules/video-reactions copy/server/procedures';
import { suggestionsRouter } from '@/modules/suggestions/server/procedures';
import { searchRouter } from '@/modules/search/server/procedures';
import { playListRouter } from '@/modules/playlist/server/procedures';
import { userRouter } from '@/modules/users/server/procedures';
 
export const appRouter = createTRPCRouter({
  categories: CategoriesRouter,
  studio: studioRouter,
  videos: videosRouter,
  users: userRouter,
  search: searchRouter,
  playList: playListRouter,
  suggestions: suggestionsRouter,
  comments: commentsRouter,
  commentReactions: commentReactionsRouter,
  subscription: subscriptionRouter,
  videoReactions: videosReactionsRouter,
  videoViews: videosViewsRouter,
});

 
// export type definition of API
export type AppRouter = typeof appRouter;