"use client"

import { InfiniteScroll } from "@/components/infinte-scroll";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEFAULT_LIMIT } from "@/constants";
import { SnakeCaseTitle } from "@/lib/utils";
import { VideoThumnail } from "@/modules/videos/ui/components/video-thumbnail";
import { useTRPC } from "@/trpc/client"
import { WifiOff, RefreshCw, PlayIcon } from "lucide-react";
import { format } from "date-fns";
import { Globe2Icon, LockIcon } from "lucide-react";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { StudioUploadModal } from "../../components/studio-upload-modal";


export const VideoSection = () => {

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
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Large Illustration */}
      <div className="relative mb-12">
        <div className="w-52 h-52 bg-muted/50 rounded-3xl flex items-center justify-center">
          <div className="text-[120px] opacity-75">🎬</div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-6 -right-6 bg-primary/10 text-primary rounded-2xl p-4 shadow-lg">
          <PlayIcon className="w-12 h-12" />
        </div>
      </div>

      <h2 className="text-4xl font-semibold mb-4 tracking-tight">
        No videos yet
      </h2>
      
      <p className="text-muted-foreground text-xl max-w-md mb-10">
        This is where your videos will appear once you upload them. 
        Start sharing your content with the world!
      </p>

      
<StudioUploadModal className={"rounded-full px-10 py-7 text-base font-medium shadow-md hover:shadow-lg transition-all"} />
      <p className="text-xs text-muted-foreground mt-16">
        Your videos are private until you publish them
      </p>
    </div>
  );
}
  return (
    <div>
      <div className="border-y overflow-x-auto">
        <table className="w-full min-w-[90vw] divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="pl-6 py-4 text-left text-sm font-medium w-full">Video</th>
              <th className="px-4 py-4 text-left text-sm font-medium w-32">Visibility</th>
              <th className="px-4 py-4 text-left text-sm font-medium w-28">Status</th>
              <th className="px-4 py-4 text-left text-sm font-medium w-full">Date</th>
              <th className="px-4 py-4 text-right text-sm font-medium w-24">Views</th>
              <th className="px-4 py-4 text-right text-sm font-medium w-24">Comments</th>
              <th className="px-4 py-4 text-right text-sm font-medium pr-6 w-24">Likes</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {allVideos.map((video) => (
              <tr 
                key={video.id}
                className="hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => window.location.href = `/studio/videos/${video.id}`}
              >
                <td className="pl-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative aspect-video w-36 shrink-0 rounded-md overflow-hidden">
                      <VideoThumnail 
                        imageUrl={video.thumbnailUrl}
                        title={video.title}
                        isShort={video.videoType === "short"}
                        duration={video.duration || 0}
                        previewUrl={video.previewUrl} 
                      />
                    </div>
                    <div className="flex flex-col overflow-hidden gap-y-1 min-w-0">
                      <span className="text-sm line-clamp-2 font-medium group-hover:text-primary transition-colors">
                        {video.title}
                      </span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {video.description || "No description"}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    {video.videoVisibility === "private" ? (
                      <LockIcon className="size-4 text-muted-foreground" />
                    ) : (
                      <Globe2Icon className="size-4 text-muted-foreground" />
                    )}
                    <span>{SnakeCaseTitle(video.videoVisibility)}</span>
                  </div>
                </td>

                <td className="px-4 py-4 text-sm">
                  {video.muxPlaybakId && video.muxAssetId 
                    ? "Ready" 
                    : SnakeCaseTitle(video.muxStatus || "processing")}
                </td>

                <td className="px-4 py-4 text-sm  text-nowrap text-muted-foreground">
                  {format(new Date(video.createdAt), "d MMM yyyy")}
                </td>

                <td className="px-4 py-4 text-right text-sm font-medium">
                  {new Intl.NumberFormat("en", { notation: "compact" }).format(video.viewCount)}
                </td>

                <td className="px-4 py-4 text-right text-sm">
                  {video.CommentCount || 0}
                </td>

                <td className="px-4 py-4 text-right text-sm pr-6">
                  {new Intl.NumberFormat("en", { notation: "compact" }).format(video.likeCount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  );
}
