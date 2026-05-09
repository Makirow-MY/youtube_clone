"use client";

import { Suspense, useState, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff, Play, Search, Trash2 } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinte-scroll";
import { LikedHeader } from "../components/liked-header";
import { LikedSidebar } from "../components/liked-sidebar";
import { CategoriesSectionn } from "@/modules/home/ui/sections/categories-section";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlaylistGrid, PlaylistGridSkeleton } from "../components/playliist-grid";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";


export const PlayListSection = ( ) => {
  return (
    <Suspense fallback={<LikedSkeleton />}>
      <ErrorBoundary
        fallbackRender={({ resetErrorBoundary }) => (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 p-8 text-center border-y bg-muted/40">
            <WifiOff className="h-16 w-16 text-muted-foreground/70" strokeWidth={1.5} />
            <div className="space-y-2">
              <h3 className="text-xl font-medium">You're offline</h3>
              <p className="text-muted-foreground max-w-md">
                Check your internet connection and try again.
              </p>
            </div>
            <Button variant="outline" size="lg" onClick={resetErrorBoundary} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        )}
      >
        <PlayListSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

const LikedSkeleton = () => {
  const isMobile = useIsMobile()

  return(
 <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:grid-cols-3" >
     {
        Array.from({length: 12}).map((list) =>(
            <PlaylistGridSkeleton  />
        )) 
    }
    
  </div>
);
}

export const PlayListSectionSuspense = () => {
  const [searchQuery, setSearchQuery] = useState("");
const [cat, setcat] = useState("");
const trpc = useTRPC();
  const playlistQuery = useSuspenseInfiniteQuery(trpc.playList.getPlayList.infiniteQueryOptions(
    { limit: DEFAULT_LIMIT,  },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  ));

  const playlist = playlistQuery.data;


  return (
  <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:grid-cols-3" >
     
    {
        playlist.pages.flatMap((o) => o.items).map((list) =>(
            <PlaylistGrid key={list.id} data={list} />
        )) 
    }
    
    </div>
  );
};