"use client"
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Loader2Icon, RefreshCw, WifiOff } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { VideoPlayer } from "../ui/components/video-player";
import { VideoBanner } from "../ui/components/video-banner";
import { VideoTopRow } from "../ui/components/video-top-row";
import { VideoDescription } from "../ui/components/video-description";
import { CommentForm } from "@/modules/comments/ui/components/comment-form";
import { CommentItem } from "@/modules/comments/ui/components/comments-items";
import { Separator } from "@/components/ui/separator";
import { getActiveResourcesInfo } from "process";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinte-scroll";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";


interface HomeViewProps {
    videoId: string;
}


export const CommentsPageSection = ({videoId}: HomeViewProps) => {
  return (
       <ErrorBoundary 
       fallback={
                <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 p-8 text-center border-y bg-transparent">
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
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </Button>
        
                    <p className="text-xs text-muted-foreground mt-4">
                      If the problem continues, check your network or try again later.
                    </p>
                  </div>
       }
       >
        <Suspense fallback={<CommentsPageSectionSkeleton />}>
   
           <CommentsPageSectionSuspense videoId={videoId} />
       </Suspense>
       </ErrorBoundary>
 
  );
}

export const CommentsPageSectionSkeleton = () => {
    return (
        <div className="mt-6 flex justify-center items-center">
            <Loader2Icon className="text-muted-foreground size-7 animate-spin" />
        </div>
    );
};


export const CommentsPageSectionSuspense = ({videoId}: HomeViewProps) => {
   const trpc = useTRPC();
     const queryClient = useQueryClient();
       const query = useSuspenseInfiniteQuery(
        trpc.comments.getMany.infiniteQueryOptions(
       {videoId: videoId, limit: DEFAULT_LIMIT}, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  }
       ))
       const comments = query.data;

 // console.log(comments)
    return (
        <>
  <div className="mt-6">
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-bold text-xl">{comments.pages[0].totalCount} Comments</h1>
      <CommentForm videoId={videoId} />
      <Separator />
      <div className="flex flex-col mt-2 gap-6">
       {comments.pages.flatMap(page => page.items).map((comment) => (
         <CommentItem key={comment.id} comments={comment} />
       ))}
       <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isManual
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
       />
      </div>

    </div>
  </div>
      </>
    );
}