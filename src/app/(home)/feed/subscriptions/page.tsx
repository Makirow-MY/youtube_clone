import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import {HydrateClient, prefetch, trpc } from '@/trpc/server';
import {HomeView} from "@/modules/home/ui/views/home-view"
import { DEFAULT_LIMIT } from '@/constants';
import { SubscriptionView } from '@/modules/home/ui/views/subscriptions-view';

 
export const dynamic = "force-dynamic"



export default async function Page () {

  
await Promise.all([
   prefetch(trpc.videos.getManySubscribed.infiniteQueryOptions({
    limit: DEFAULT_LIMIT
   },   { getNextPageParam: (lastPage) => lastPage.nextCursor }
  ))

   ]);
return (
    <HydrateClient>

      <SubscriptionView  />
    
    </HydrateClient>
  );
}