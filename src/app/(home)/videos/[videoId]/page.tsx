import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import {HydrateClient, trpc, prefetch } from '@/trpc/server';
import {HomeView} from "@/modules/home/ui/views/home-view"
import { VideoPageView } from '@/modules/videos/views/video-views';
import { DEFAULT_LIMIT } from '@/constants';

 
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{
    videoId: string
  }>
}


export default async function Page ({params}: PageProps) {
  const {videoId} = await params

  await Promise.all([
      prefetch(trpc.videos.getOne.queryOptions({ id: videoId })), // normal query
  
      // ✅ infinite queries now use .infiniteQueryOptions + getNextPageParam
      prefetch(
        trpc.comments.getMany.infiniteQueryOptions(
         {videoId,
      limit: DEFAULT_LIMIT,},
       { getNextPageParam: (lastPage) => lastPage.nextCursor },
        ),
      ),
       prefetch(trpc.playList.getPlayList.infiniteQueryOptions({
              // categoryId:categoryId,
              limit: DEFAULT_LIMIT,
              },  { getNextPageParam: (lastPage) => lastPage.nextCursor },)),
      prefetch(
       trpc.suggestions.getMany.infiniteQueryOptions(
          { videoId: videoId,
      limit: DEFAULT_LIMIT, },
          { getNextPageParam: (lastPage) => lastPage.nextCursor },
        ),
      ),
    ]);
return (
   <HydrateClient>

      <VideoPageView videoId={videoId} />
    
    </HydrateClient>
  );
}