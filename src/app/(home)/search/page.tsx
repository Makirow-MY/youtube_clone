import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import {HydrateClient, prefetch, trpc } from '@/trpc/server';
import {HomeView} from "@/modules/home/ui/views/home-view"
import { SearchView } from '@/modules/search/ui/view/search-view';
import { DEFAULT_LIMIT } from '@/constants';

 
export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{
    categoryId: string  | undefined,
    query: string | undefined;
  }>
}



export default async function Page ({searchParams}: PageProps) {
  const {categoryId, query} = await searchParams

   await Promise.all([
       prefetch(trpc.categories.getMany.queryOptions({
    categoryId: categoryId,
   })), // normal query
   
       // ✅ infinite queries now use .infiniteQueryOptions + getNextPageParam
       prefetch(
         trpc.search.getMany.infiniteQueryOptions(
          {query, categoryId,
        limit: DEFAULT_LIMIT,},
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
         ),
       ),

       prefetch( 
      trpc.search.suggestions.queryOptions({
          query: "",
          limit: 8,
        })
      ),
      
     ]);
  return (
    <HydrateClient>

      <SearchView query={query} categoryId={categoryId} />
    
    </HydrateClient>
  );
}