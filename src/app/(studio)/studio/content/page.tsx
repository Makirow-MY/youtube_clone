import { DEFAULT_LIMIT } from '@/constants';
import { StudioView } from '@/modules/studio/ui/view/studio-view';
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import React from 'react'

export const dynamic = "force-dynamic"

export default  async function Page () {
  

   await Promise.all([
       prefetch(
         trpc.studio.getMany.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
           { getNextPageParam: (lastPage) => lastPage.nextCursor },
         ),
       ),
      
     ]);

  return (
    <HydrateClient>
      <StudioView />
    </HydrateClient>
  )
}
