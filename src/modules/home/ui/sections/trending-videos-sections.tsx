"use client"
import { Suspense } from "react";
import { CategoriesSectionn } from "./categories-section";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { InfiniteScroll } from "@/components/infinte-scroll";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";

export const TrendingVideosSection = () => {
  return (

    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 p-8 text-center border-y bg-transparent">
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
    >
      <Suspense
        fallback={
          <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:grid-cols-3" >
            {
              Array.from({ length: 12 }).map((_, index) =>
              (
                <VideoGridCardSkeleton key={index} />
              ))
            }
          </div>
        } >
        <TrendingVideosSectionSuspense />
      </Suspense>
    </ErrorBoundary>

  );
}


export const TrendingVideosSectionSuspense = () => {
  const isMobile = useIsMobile()
  const trpc = useTRPC();
  
  const query = useSuspenseInfiniteQuery(trpc.videos.getManyTrending.infiniteQueryOptions(
    { limit: DEFAULT_LIMIT,
      videoType: "video",
  
     },
    {
      getNextPageParam: (lastpage) => lastpage.nextCursor,
    }
  ))
  const videos = query.data
console.log({MYTrdningVideos:  videos})
  return (
    <div>
      <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:grid-cols-3" >
        {
          videos.pages.flatMap((p) => p.items).map((video) =>
          (
            <VideoGridCard key={video.id} data={video} />
          ))
        }
      </div>

    </div>
  );
}