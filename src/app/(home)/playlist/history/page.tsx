import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import {HydrateClient, trpc, prefetch } from '@/trpc/server';
import {HomeView} from "@/modules/home/ui/views/home-view"
import { SearchView } from '@/modules/search/ui/view/search-view';
import { DEFAULT_LIMIT } from '@/constants';
import { HistoryView } from '@/modules/playlist/ui/views/history-view';

 
export const dynamic = "force-dynamic"



export default async function Page () {

 await Promise.all([
     prefetch(trpc.playList.getHistory.infiniteQueryOptions({
        limit: DEFAULT_LIMIT,
    }, { getNextPageParam: (lastPage) => lastPage.nextCursor },))
    
    
   ]);
 
  return (
    <HydrateClient>

      <HistoryView  />
    
    </HydrateClient>
  );
}