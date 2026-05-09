import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react'
import React from 'react'
import { VideoGetOneOutput } from '../../types'
import { useClerk } from '@clerk/nextjs'
import { useTRPC } from '@/trpc/client'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DEFAULT_LIMIT } from '@/constants'

interface VideoReactionsProps {
    videoId: string;
    likes: number;
    dislikes: number;
    viewerReaction: VideoGetOneOutput["viewerReaction"];
}

export function VideoReactions({ videoId, likes, dislikes, viewerReaction }: VideoReactionsProps) {
 const clerk = useClerk()
 const trpc = useTRPC();
    const queryClient = useQueryClient();
 
     const like = useMutation(
          trpc.videoReactions.like.mutationOptions({
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: trpc.playList.getLike.queryKey({ limit: DEFAULT_LIMIT }),
              });
                  queryClient.invalidateQueries({
                queryKey: trpc.videos.getOne.queryKey({id: videoId}),
              });
               
            toast.success("Video liked successfully")
             
            },
                onError(error) {
      if(error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn()
        toast.error("You must sign in to like this video.")
      }
      else{
        toast.error("An error occurred while processing your reaction. Please try again.")
      }
     }
          })
        ); 



   const dislike = useMutation(
          trpc.videoReactions.dislike.mutationOptions({
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: trpc.playList.getLike.queryKey({ limit: DEFAULT_LIMIT }),
              });
                  queryClient.invalidateQueries({
                queryKey: trpc.videos.getOne.queryKey({id: videoId}),
              });
               
            toast.success("Video disliked successfully")
             
            },
               onError(error) {
      if(error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn()
        toast.error("You must sign in to dislike this video.")
      }
        else{
        toast.error("An error occurred while processing your reaction. Please try again.")            
        }
     }
          })
        ); 
      
  
  return (
    <div className='flex items-center  flex-none'>
     <Button
     onClick={() => like.mutate({videoId})}
     disabled={like.isPending || dislike.isPending}
     variant={"secondary"} className="rounded-l-full rounded-r-none pr-4 gap-2">
        <ThumbsUpIcon className={cn("size-5",
            viewerReaction === "like" && "fill-black"
        )} />
        {likes}
     </Button>
     <Separator orientation="vertical" className='h-7' />
     <Button
      onClick={() => dislike.mutate({videoId})}
     disabled={like.isPending || dislike.isPending}
     variant={"secondary"} className="rounded-l-none rounded-r-full pl-3">
        <ThumbsDownIcon className={cn("size-5",
            viewerReaction === "dislike" && "fill-black"
        )} />
        {dislikes}
     </Button>

     

    </div>
  )
}
