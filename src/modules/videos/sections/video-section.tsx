"use client"
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {  useTRPC } from "@/trpc/client";
import { PlayIcon, RefreshCw, WifiOff } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { VideoPlayer } from "../ui/components/video-player";
import { VideoBanner } from "../ui/components/video-banner";
import { VideoTopRow } from "../ui/components/video-top-row";
import { VideoDescription } from "../ui/components/video-description";
import { useAuth } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";


interface HomeViewProps {
    videoId: string;
}


export const VideoPageSection = ({videoId}: HomeViewProps) => {

  return (
       <ErrorBoundary 
        fallbackRender={({ resetErrorBoundary }) => (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 p-8 text-center border-y bg-muted/40">
            <WifiOff className="h-16 w-16 text-muted-foreground/70" strokeWidth={1.5} />
            
            <div className="space-y-2">
              <h3 className="text-xl font-medium">You're offline</h3>
              <p className="text-muted-foreground max-w-md">
                Check your internet connection and try again. 
                This page requires an active connection to load your videos.
              </p>
            </div>

            <Button 
              variant="outline" 
              size="lg"
              onClick={resetErrorBoundary}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              If the problem continues, check your network or try again later.
            </p>
          </div>
        )}
       >  <Suspense fallback={<VideoPageSkeleton /> }>
               <VideoPageSectionSuspense videoId={videoId} />
        </Suspense>
       </ErrorBoundary>
  
  );
}

export const VideoPageSectionSuspense = ({videoId}: HomeViewProps) => {
 const trpc = useTRPC();

const queryClient = useQueryClient();
  const videoQuery = useSuspenseQuery(trpc.videos.getOne.queryOptions({id: videoId}))
  const video = videoQuery.data;
  
  const {isSignedIn} = useAuth() 

const createViewMutation = useMutation(
    trpc.videoViews.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.videos.getOne.queryKey({ id: videoId }),
        });
      },
      onError(error) {
        console.error("Error recording video view", error);
        toast.error("An error occurred while recording your view. Please try again.")
      }
    })
  );
  const handleVideoPlay = () => {
    if(!isSignedIn) return;
    createViewMutation.mutate({videoId})
  }
  return (
        <>
    <div className={cn(
        "aspect-video bg-black rounded-xl overflow-hidden relative",
         video.muxStatus !== "ready" && "rounded-b-none"
    )}>
       <VideoPlayer
       onPlay={handleVideoPlay}
       playbackId={video.muxPlaybakId}
       thumbnailUrl={video.thumbnailUrl}
       />
    </div>
    <VideoBanner  status={video.muxStatus} />
    <VideoTopRow  video={video} />
      </>
  );
}


export function VideoPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Video Player Area */}
      <div className="aspect-video bg-primary rounded-xl overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <PlayIcon className="size-9 fill-white text-white rounded-sm ml-1" /> {/* Play triangle */}
          </div>
        </div>
        <Skeleton
         className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />
      </div>

     
      {/* Title */}
      <Skeleton className="h-6 w-[80%] rounded-md" />

      {/* Owner + Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Channel Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-muted" />
          </Avatar>

          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>

          <Skeleton className="ml-auto sm:ml-4 h-9 w-28 rounded-full" />
        </div>

        {/* Reactions + Menu */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Skeleton className="h-9 w-24 rounded-l-full" />
            <Separator orientation="vertical" className="h-9 bg-white" />
            <Skeleton className="h-9 w-20 rounded-r-full" />
          </div>

          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      {/* Description Box */}
      <div className="bg-secondary/70 p-4 rounded-xl space-y-4">
        {/* Views + Date */}
        <div className="flex gap-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>

        {/* Description Lines */}
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[75%]" />
        </div>

        {/* Show more button area */}
        <Skeleton className="h-5 w-24 mt-2" />
      </div>
    </div>
  );
}