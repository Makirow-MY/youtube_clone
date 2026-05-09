"use client"

import { InfiniteScroll } from "@/components/infinte-scroll";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEFAULT_LIMIT } from "@/constants";
import { SnakeCaseTitle } from "@/lib/utils";
import { VideoThumnail } from "@/modules/videos/ui/components/video-thumbnail";
import { useTRPC } from "@/trpc/client"
import { WifiOff, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Globe2Icon, LockIcon } from "lucide-react";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";


export const VideoSection = () => {

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
    >
      <Suspense fallback={<VideoSectionSkeleton />}>

        <VideoSectionSuspense />

      </Suspense>
    </ErrorBoundary>


  )

}

const VideoSectionSkeleton = () => {
  return (
    <>
      <div className="border-y">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-[510px]" >Video</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>

              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Comments</TableHead>
              <TableHead className="text-right pr-6">Likes</TableHead>
            </TableRow>
          </TableHeader>

          {
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell className="pl-6">
                  <div className=" flex items-center gap-4">
                    <Skeleton className="h-20 w-36" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </TableCell>
                <TableCell className="text-right pr-6">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </TableCell>
              </TableRow>
            ))
          }

          <TableBody>

          </TableBody>
        </Table>
      </div>
    </>
  )
}

const VideoSectionSuspense = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
 // const myUserId = window.localStorage.getItem("MyUserId")

  const query = useSuspenseInfiniteQuery(
    trpc.studio.getMany.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )
  );

  const videos = query.data;

  const allVideos = videos.pages.flatMap((page) => page.items);

  if (allVideos.length === 0) {
    return (
      <div className="border-y min-h-[50vh] flex flex-col items-center justify-center gap-4 py-20 text-center text-muted-foreground">
        <div className="text-6xl opacity-40">🎥</div>
        <h3 className="text-xl font-medium">No videos yet</h3>
        <p>Upload your first video to see it here.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="border-y">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6" >Video</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>

              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Comments</TableHead>
              <TableHead className="text-right pr-6">Likes</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {
              allVideos.map((video) => (
                <a href={`/studio/videos/${video.id}`} key={video.id} >
                  <TableRow className="cursor-pointer">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-4 w-[510px]">
                        <div className="relative aspect-video w-36 shrink-0">
                          <VideoThumnail imageUrl={video.thumbnailUrl}
                            title={video.title}
                            isShort={video.videoType === "short"}
                            duration={video.duration || 0}
                            previewUrl={video.previewUrl} />
                        </div>
                        <div className="flex shrink-0 flex-col overflow-hidden gap-y-1">
                          <span className="text-sm line-clamp-1">{video.title}</span>
                          <span className="text-xs w-[150px] text-muted-foreground line-clamp-1">{"No description for this video yet"}</span>
                        </div>

                      </div>

                    </TableCell>

                    <TableCell className="text-xs ml-auto">
                      <div className="text-xs flex  items-center">
                        {
                          video.videoVisibility === "private" ?
                            <LockIcon className="size-4 mr-2" />
                            :

                            <Globe2Icon className="size-4 mr-2" />

                        }
                        {
                          SnakeCaseTitle(video.videoVisibility)
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs flex  items-center">
                        {

                          video.muxPlaybakId && video.muxAssetId ? "Ready" : SnakeCaseTitle(video.muxStatus || "error")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs flex shrink-0 items-center truncate">
                        {format(new Date(video.createdAt), "d MMM yyyy")}
                      </div>

                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {new Intl.NumberFormat("en", {
                        notation: "compact",
                        //   compactDisplay: "short"
                      }).format(video.viewCount)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {video.CommentCount}
                    </TableCell>
                    <TableCell className="text-right text-sm pr-6">
                      {new Intl.NumberFormat("en", {
                        notation: "compact",
                        //   compactDisplay: "short"
                      }).format(video.likeCount)}
                    </TableCell>
                  </TableRow>
                </a>
              ))
            }
          </TableBody>
        </Table>
      </div>

      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  )

}
