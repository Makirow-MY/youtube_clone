import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import {HydrateClient, trpc, prefetch } from '@/trpc/server';
import {HomeView} from "@/modules/home/ui/views/home-view"
import { SearchView } from '@/modules/search/ui/view/search-view';
import { DEFAULT_LIMIT } from '@/constants';
import { LikedView } from '@/modules/playlist/ui/views/liked-view';

export const dynamic = "force-dynamic"



interface PageProps {
  searchParams: Promise<{
    categoryId?: string
  }>
}


export default async function Page ({searchParams}: PageProps) {
  const {categoryId} = await searchParams
  
 await Promise.all([
   
     prefetch(trpc.playList.getLike.infiniteQueryOptions({
           categoryId:categoryId,
        limit: DEFAULT_LIMIT,
            },  { getNextPageParam: (lastPage) => lastPage.nextCursor },)),
   ]);
 
  return (
    <HydrateClient>

      <LikedView  categoryId={categoryId}  />
    
    </HydrateClient>
  );
}