import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import {HydrateClient, prefetch, trpc } from '@/trpc/server';
import {HomeView} from "@/modules/home/ui/views/home-view"
import { DEFAULT_LIMIT } from '@/constants';
import { ShortView} from '@/modules/home/ui/views/short-view';

 
export const dynamic = "force-dynamic"



export default async function Page () {

  
await Promise.all([
  prefetch(trpc.videos.getMany.infiniteQueryOptions({
         limit: DEFAULT_LIMIT,
          },  { getNextPageParam: (lastPage) => lastPage.nextCursor, enabled: true })),
 ]);
return (
    <HydrateClient>

      <ShortView  />
    
    </HydrateClient>
  );
}