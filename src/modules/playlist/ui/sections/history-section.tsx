

"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff, Search, Trash2, Pause, Settings, HistoryIcon, Clock } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinte-scroll";
import { HistoryHeader } from "../components/history-header";
import { HistoryGroups } from "../components/history-groups";
import { HistoryRightSidebar } from "../components/history-right-sidebar";
import { format, isToday, isYesterday, subDays } from "date-fns";
import { useMutation, useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";

export const HistorySection = () => {
  return (
    <Suspense fallback={<HistorySkeleton />}>
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
        <HistorySectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

const HistorySkeleton = () => (
  <div className="space-y-10">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-4">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 md:hidden gap-4">
          {Array.from({ length: 6}).map((_, j) => <VideoGridCardSkeleton key={j} />)}
        </div>
        <div className="hidden md:block space-y-4">
          {Array.from({ length: 6 }).map((_, j) => <VideoRowCardSkeleton size="compact" key={j} />)}
        </div>
      </div>
    ))}
  </div>
);
function groupVideosByDate(videos: any[], searchQuery: string) {
  const filtered = searchQuery
    ? videos.filter((v) =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : videos;

  const groups: Record<string, any[]> = {};

  filtered.forEach((video) => {
    const viewedDate = new Date(video.viewedAt);
    let label: string;

    if (isToday(viewedDate)) label = "Today";
    else if (isYesterday(viewedDate)) label = "Yesterday";
    else if (viewedDate > subDays(new Date(), 7)) {
      label = format(viewedDate, "EEEE"); // Monday, Tuesday...
    } else {
      label = format(viewedDate, "MMMM d, yyyy");
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(video);
  });

  return groups;
}

export const HistorySectionSuspense = () => {
  const [searchQuery, setSearchQuery] = useState("");

const trpc = useTRPC();
  const queryClient = useQueryClient();
 // const myUserId =  window.localStorage.getItem("MyUserId")

const videosQuery = useSuspenseInfiniteQuery(
    trpc.playList.getHistory.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT, //myUserId

      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )
  );

  const historyData = videosQuery.data;
  // Flatten all videos
  const allVideos = historyData.pages.flatMap((page) => page.items);

  // Group videos by date (Today, Yesterday, Monday 12 May 2025, etc.)
  const groupedVideos = groupVideosByDate(allVideos, searchQuery);

  return (
    <>
    {allVideos.length > 0 && <div className="flex flex-col-reverse lg:flex-row gap-8">
      {/* Main Content Area */}
     <div className="flex-1 min-w-0">
       
        <HistoryGroups 
          groupedVideos={groupedVideos} 
          onRemoveFromHistory={async (videoId) => {
            
            const Remove = useMutation(
    trpc.playList.removeFromHistory.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.playList.getHistory.queryKey({ limit: DEFAULT_LIMIT }),
        });
      },
    })
  );
           Remove.mutate({ videoId });
            videosQuery.refetch();
          }}
        />

        <InfiniteScroll
          hasNextPage={videosQuery.hasNextPage}
          fetchNextPage={videosQuery.fetchNextPage}
          isFetchingNextPage={videosQuery.isFetchingNextPage}
        />
      </div>
       {/* Right Sidebar - YouTube Style Actions */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <HistoryRightSidebar  searchQuery={searchQuery} 
          onSearchChange={setSearchQuery}  />
      </div>
    </div>
  }
 {
  allVideos.length === 0 && (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-20 px-6 text-center">
      <div className="relative mb-10">
        <div className="w-40 h-40 rounded-full bg-muted/60 flex items-center justify-center">
          <HistoryIcon className="w-28 h-28 text-muted-foreground/50" strokeWidth={1.1} />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-background p-3 rounded-full shadow-lg border">
          <Clock className="w-10 h-10 text-muted-foreground" />
        </div>
      </div>

      <h2 className="text-3xl font-semibold mb-3">No watch history yet</h2>
      <p className="text-muted-foreground max-w-md text-lg mb-10">
        Videos you watch will appear here. Start exploring and building your history!
      </p>

      <Button 
        size="lg" 
        className="rounded-full px-10 py-6 text-base font-medium"
        onClick={() => window.location.href = '/'}
      >
        Browse Videos
      </Button>

      <p className="text-xs text-muted-foreground mt-12">
        Your watch history is private to you
      </p>
    </div>
  )
}
</>
  );
};