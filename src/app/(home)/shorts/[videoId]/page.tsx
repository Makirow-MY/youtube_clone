import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import {HydrateClient, trpc, prefetch } from '@/trpc/server';
import {HomeView} from "@/modules/home/ui/views/home-view"
import { VideoPageView } from '@/modules/videos/views/video-views';
import { DEFAULT_LIMIT } from '@/constants';
import { ShortView } from '@/modules/home/ui/views/short-view';

 
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{
    videoId: string
  }>
}


export default async function Page ({params}: PageProps) {
  const {videoId} = await params

  await Promise.all([
      prefetch(trpc.videos.getOne.queryOptions({ id: videoId,
        videoType: "short",
       })), 
    prefetch(
        trpc.comments.getMany.infiniteQueryOptions(
         {videoId,
      limit: DEFAULT_LIMIT,},
       { getNextPageParam: (lastPage) => lastPage.nextCursor },
        ),
      ),
 prefetch(trpc.videos.getMany.infiniteQueryOptions({
         limit: DEFAULT_LIMIT,
          },  { getNextPageParam: (lastPage) => lastPage.nextCursor, enabled: true })),

    ]);
return (
   <HydrateClient>

      <ShortView videoId={videoId} />
    
    </HydrateClient>
  );
}