import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import {HydrateClient, trpc, prefetch } from '@/trpc/server';
import {HomeView} from "@/modules/home/ui/views/home-view"
import { VideoPageView } from '@/modules/videos/views/video-views';
import { DEFAULT_LIMIT } from '@/constants';
import { PlayListSubView } from '@/modules/playlist/ui/views/playlist-sub-view';

 
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{
    playlistId: string
  }>
}


export default async function Page ({params}: PageProps) {
  const {playlistId} = await params
console.log({playlistId})
  await Promise.all([

   prefetch(
    trpc.playList.getOne.infiniteQueryOptions({
        playlistId: playlistId,
        limit: DEFAULT_LIMIT,
        },  { getNextPageParam: (lastPage) => lastPage.nextCursor },)),

    ]);
return (
   <HydrateClient>

      <PlayListSubView playListId={playlistId} />

    </HydrateClient>

  );
}