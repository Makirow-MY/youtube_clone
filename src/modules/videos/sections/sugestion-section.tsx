"use client"
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { RefreshCw, WifiOff } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { VideoPlayer } from "../ui/components/video-player";
import { VideoBanner } from "../ui/components/video-banner";
import { VideoTopRow } from "../ui/components/video-top-row";
import { VideoDescription } from "../ui/components/video-description";
import { DEFAULT_LIMIT } from "@/constants";
import { VideoRowCard, VideoRowCardSkeleton } from "../ui/components/video-row-card";
import { VideoGridCard, VideoGridCardSkeleton } from "../ui/components/video-grid-card";
import { InfiniteScroll } from "@/components/infinte-scroll";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { CategoriesSection } from "@/modules/search/ui/sections/categories-section";


interface HomeViewProps {
  videoId: string;
  playlistId?: string
  isManual?: boolean;
}


export const SuggestionPageSection = ({ videoId, isManual, playlistId }: HomeViewProps) => {
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
      }>
      <Suspense fallback={
        <div className="space-y-6">
          {/* Desktop fallback */}
          <div className="hidden md:block space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <VideoRowCardSkeleton key={i} size="compact" />
            ))}
          </div>

          {/* Mobile fallback */}
          <div className="block md:hidden space-y-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <VideoGridCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }>
        <SuggestionPageSectionSuspense playlistId={playlistId} isManual={isManual} videoId={videoId} />
      </Suspense>
    </ErrorBoundary>

  );
}



export const SuggestionPageSectionSuspense = ({ videoId, isManual, playlistId }: HomeViewProps) => {

  const trpc = useTRPC();

  const query = useSuspenseInfiniteQuery(trpc.suggestions.getMany.infiniteQueryOptions(
    {
      videoId: videoId,
      playlistId: playlistId,
      limit: DEFAULT_LIMIT
    }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  }
  ))
  const suggestions = query.data;
console.log("suggestions query", suggestions.pages.flatMap(page => page.playlist))
  return (
    <>
      <div className="hidden md:block space-y-4">
        {
          playlistId && <div className="bg-secondary rounded-lg">
          <div className=" p-3 shadow-sm">
            <h1 className="text-xl font-bold mb-2">{suggestions.pages.flatMap(page => page.playlist)[0]?.name || "Playlist"}</h1>
             <p className="text-sm  text-muted-foreground mb-2">{suggestions.pages.flatMap(page => page.playlist)[0]?.videoCount} videos</p>
          </div>

           <div className="bg-primary-foreground py-2 pb-4 space-y-4 max-h-[60vh] overflow-y-scroll ">
            {
              suggestions.pages.flatMap(page => page.items).filter((video) => video.playlistId === playlistId).map(video => (
                <VideoRowCard videoId={videoId} playlistId={playlistId} key={video.id} data={video} size={"veryCompact"} />
              ))
            }
            </div>

          </div>
        }
          <div className="mt-1 space-y-2">
            <CategoriesSection limit={5} />
        {
          suggestions.pages.flatMap(page => page.items).map(video => (
            <VideoRowCard  key={video.id} data={video} size={"compact"} />
          ))
        }
      </div>
        </div>


      <div className="block md:hidden space-y-5">
        {
          suggestions.pages.flatMap(page => page.items).map(video => (
            <VideoGridCard playlistId={playlistId} key={video.id} data={video} />
          ))
        }</div>

      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        fetchNextPage={query.fetchNextPage}
        isFetchingNextPage={query.isFetchingNextPage}

      />
    </>
  );
}