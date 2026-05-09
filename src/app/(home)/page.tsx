import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { HydrateClient, trpc, prefetch } from '@/trpc/server';
import { HomeView } from "@/modules/home/ui/views/home-view"
import { DEFAULT_LIMIT } from '@/constants';


export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{
    categoryId?: string
  }>
}


export default async function Page({ searchParams }: PageProps) {
  const { categoryId } = await searchParams

  await Promise.all([
    prefetch(trpc.categories.getMany.queryOptions({
      categoryId: categoryId,
    })), // normal query

    // ✅ infinite queries now use .infiniteQueryOptions + getNextPageParam
    prefetch(
      trpc.videos.getMany.infiniteQueryOptions(
        { limit: DEFAULT_LIMIT, categoryId,
       
         },
        { getNextPageParam: (lastPage) => lastPage.nextCursor, enabled: true  },
      ),
    ),

    prefetch(trpc.videos.getManyTrending.infiniteQueryOptions({
      // categoryId:categoryId,
      limit: DEFAULT_LIMIT,
    }, { getNextPageParam: (lastPage) => lastPage.nextCursor },)),
    prefetch(
      trpc.search.suggestions.queryOptions({
        query: "",
        limit: 8,
      })
    ),
    prefetch(trpc.playList.getPlayList.infiniteQueryOptions({
      limit: DEFAULT_LIMIT,
    }, { getNextPageParam: (lastPage) => lastPage.nextCursor },)),
  
    
  ]);

  return (
    <HydrateClient>

      <HomeView categoryId={categoryId} />

    </HydrateClient>
  );
}