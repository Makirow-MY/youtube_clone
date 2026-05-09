import { VideoView } from "@/modules/studio/ui/view/video-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server"


export const dynamic = "force-dynamic"

interface PageProps{
    params: Promise<{videoId: string}>
}
import React from 'react'

export default async function page({params}: PageProps) {
    const {videoId} = await params;
   await Promise.all([
    prefetch(trpc.studio.getOne.queryOptions({id: videoId})),
    prefetch(trpc.categories.getMany.queryOptions({
        categoryId: null
    }))

   ]);
    return(
        <HydrateClient>
              <VideoView videoId={videoId} />
        </HydrateClient>
    )
}