import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import {HydrateClient, prefetch, trpc } from '@/trpc/server';
import {HomeView} from "@/modules/home/ui/views/home-view"
import { SearchView } from '@/modules/search/ui/view/search-view';
import { DEFAULT_LIMIT } from '@/constants';
import { LikedView } from '@/modules/playlist/ui/views/liked-view';
import { PlayListView } from '@/modules/playlist/ui/views/playlist-view';

export const dynamic = "force-dynamic"



interface PageProps {
  searchParams: Promise<{
    categoryId?: string
  }>
}


export default async function Page ({searchParams}: PageProps) {
 const {categoryId} = await searchParams
  
 await Promise.all([
    
     prefetch(trpc.playList.getPlayList.infiniteQueryOptions({
        // categoryId:categoryId,
        limit: DEFAULT_LIMIT,
        },  { getNextPageParam: (lastPage) => lastPage.nextCursor },)),
   ]);
 
  return (
    <HydrateClient>

      <PlayListView  />
    
    </HydrateClient>
  );
}