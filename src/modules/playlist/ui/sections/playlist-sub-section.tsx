

"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff, Search, Trash2, Pause, Settings, TrashIcon, Trash2Icon } from "lucide-react";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SuscriptionButtonProps {
  playListId: string;

}
export const PlaylistSubSection = ({ playListId }: SuscriptionButtonProps) => {
  return (

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
      <Suspense fallback={<HistorySkeleton />}>
        <PlaylistSubSectionSuspense playListId={playListId} />
      </Suspense>
    </ErrorBoundary>

  );
};

const HistorySkeleton = () => (
  <>
  <div className="flex justify-between items-center">
       <div className="mb-2">
         <h1 className="text-3xl font-bold mb-2 capitalize">PlayList Loading </h1>
         <div className="h-6 w-[15rem] bg-muted rounded" />
  </div>

  
             </div>

  <div className="space-y-10">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-4">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 md:hidden gap-4">
          {Array.from({ length: 6 }).map((_, j) => <VideoGridCardSkeleton key={j} />)}
        </div>
        <div className="hidden md:block space-y-4">
          {Array.from({ length: 6 }).map((_, j) => <VideoRowCardSkeleton size="compact" key={j} />)}
        </div>
      </div>
    ))}
  </div>
  </>
);

export const PlaylistSubSectionSuspense = ({ playListId }: SuscriptionButtonProps) => {
  const [searchQuery, setSearchQuery] = useState("");
 const router = useRouter()
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const videosQuery = useSuspenseInfiniteQuery(
    trpc.playList.getOne.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT, playlistId: playListId },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )
  );
  const remove = useMutation(
    trpc.playList.removePlaylist.mutationOptions({
      onSuccess: async() => {
    
    await  queryClient.invalidateQueries({
        queryKey: trpc.playList.getPlayList.queryKey(),
      });

       toast.success("Playlist removed sucessfully")
      router.push(`/playlist`)
      },
       onError: (error) => {
      toast.error("Failed to delete video. Poor internet connection")
        },
    })
  );

   const removeVideo = useMutation(
    trpc.playList.removeVideoFromPlaylist.mutationOptions({
      onSuccess: async() => {
    
    await  queryClient.invalidateQueries({
        queryKey: trpc.playList.getPlayList.queryKey(),
      });

       toast.success("Playlist removed sucessfully")
      router.push(`/playlist`)
      },
       onError: (error) => {
      toast.error("Failed to delete video. Poor internet connection")
        },
    })
  );
  const historyData = videosQuery.data;
  // Flatten all videos
  const allVideos = historyData.pages.flatMap((page) => page.items).filter((video) =>video.playlistId === playListId);
  const allPlaylist = historyData.pages.flatMap((page) => page.PlayList).slice(0, 1);
  const PlayListTitle = allPlaylist[0]?.name;

  console.log({ PlayListTitle, allPlaylist });

  return (
    <>
      <div className="flex justify-between items-center">
       <div className="mb-2">
         <h1 className="text-3xl font-bold mb-2 capitalize">{PlayListTitle} PlayList </h1>
        <p className="text-sm text-muted-foreground">{allPlaylist[0]?.description || `Amazing videos you got here in this playlist`}</p>
  </div>

  <Button variant={"outline"} disabled={remove.isPending} size={"icon"}
  onClick={() =>{
   //  const myUserId =  window.localStorage.getItem("MyUserId")
    remove.mutate({playlistId: allPlaylist[0].id, //myUserId

    })
  }}
   className="rounded-full">
<Trash2Icon className="size-4" />
  </Button>
             </div>

      <div className="space-y-8">
        {allVideos.map((video) => (
          <a key={video.id}  href={`/playlist/${playListId}/${video.id}`} className="md:hidden">
            <VideoGridCard playlistId={playListId} data={video} onRemove={() => {
               const myUserId =  window.localStorage.getItem("MyUserId")
              removeVideo.mutate({playlistId: playListId, videoId: video.id, myUserId})
              }} />
          </a>
        ))}

        {allVideos.map((video, index) => (
          <a key={video.id} href={`/playlist/${playListId}/${video.id}`}  className="hidden  items-center gap-2 md:flex">
            <span className="text-muted-foreground text-sm">{index + 1}</span>
            <div className="w-full">
              <VideoRowCard playlistId={playListId} size="compact" data={video} />
            </div>
          </a>
        ))}

        {allVideos.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No Video In this PlayList.
          </p>
        )}
      </div>

      <InfiniteScroll
        hasNextPage={videosQuery.hasNextPage}
        fetchNextPage={videosQuery.fetchNextPage}
        isFetchingNextPage={videosQuery.isFetchingNextPage}
      />

    </>
  );
};