"use client";

import { Suspense, useMemo, useRef, useState, useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Heart, MessageCircle, Music2, RefreshCw, Share2Icon, ThumbsDownIcon, ThumbsUpIcon, WifiOff } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ShortsGridCard } from "../../components/shorts-grid";
import { DEFAULT_LIMIT } from "@/constants";
import { useMutation, useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ShortsPlayer } from "@/modules/videos/ui/components/short-player";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import { VideoOwner } from "@/modules/videos/ui/components/video-owner";
import { toast } from "sonner";
import { useAuth, useClerk } from "@clerk/nextjs";
import { CommentsDrawer } from "@/modules/videos/ui/components/commentDrawer";
import MuxPlayer from "@mux/mux-player-react";
import { THUMBNAIL_FALLBACK } from "@/modules/videos/constants";
import { useRouter } from "next/navigation";

interface HomeVideosSectionProps {
    videoId?: string | null;
}

export const ShortsSection = ({ videoId }: HomeVideosSectionProps) => {
  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <div className="min-h-[200px] flex items-center justify-center">
          <Button onClick={resetErrorBoundary} variant="outline">
            Retry loading Shorts
          </Button>
        </div>
      )}
    >
      <Suspense fallback={<ShortsSkeleton />}>
        <ShortsSectionSuspense videoId={videoId} />
      </Suspense>
    </ErrorBoundary>
  );
};

const ShortsSkeleton = () => (
  <div className="h-screen flex justify-center relative w-full ">
    {/* Main video skeleton */}
    <div className="relative flex items-center gap-4">
      {/* Video container skeleton */}
      <div className="h-screen relative aspect-[9/16] overflow-hidden rounded-3xl bg-secondary shadow-2xl">
        <div className="absolute inset-0 z-40 w-full h-full bg-gradient-to-b from-gray-800/50 to-gray-900/90 animate-pulse">
          {/* Subtle shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </div>
        
        {/* Loading spinner in center */}
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-red-600 animate-spin" />
        </div>
      </div>

      {/* Right side action buttons skeleton */}
      <div className="md:flex hidden flex-col items-center space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="h-10 w-10 rounded-full bg-black/10" />
            <Skeleton className="h-3 w-6 bg-black/10" />
          </div>
        ))}
      </div>
    </div>

    {/* Left overlay content skeleton */}
    <div className="absolute bottom-[50px] z-50 left-0 right-1/3 p-4">
      <div className="space-y-4">
        {/* Channel info skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full bg-black/10" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-black/10" />
            <Skeleton className="h-3 w-24 bg-black/10" />
          </div>
        </div>

        {/* Video title skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-48 bg-black/10" />
          <Skeleton className="h-4 w-36 bg-black/10" />
        </div>

        {/* Hashtags skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-3 w-16 bg-black/10" />
          <Skeleton className="h-3 w-12 bg-black/10" />
          <Skeleton className="h-3 w-14 bg-black/10" />
        </div>
      </div>
    </div>

    {/* Navigation buttons skeleton */}
    <div className="md:flex absolute right-4 top-1/2 z-50 -translate-y-1/2 hidden flex-col gap-3">
      <Skeleton className="h-10 w-10 rounded-full bg-black/10" />
      <Skeleton className="h-10 w-10 rounded-full bg-black/10" />
    </div>

    {/* Progress bar skeleton at bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/10">
      <div className="h-full bg-red-600/50 w-1/3 animate-pulse" />
    </div>
  </div>
);

export const ShortsSectionSuspense = ({ videoId }: HomeVideosSectionProps) => {
  const trpc = useTRPC();
  const clerk = useClerk();
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [isMuted, setIsMuted] = useState(false);
  const router = useRouter();
  const [volume, setVolume] = useState(1);
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);

  // ALWAYS load the infinite random shorts feed (this powers "next" navigation and prefetching)
  const videosQuery = useSuspenseInfiniteQuery(
    trpc.videos.getMany.infiniteQueryOptions(
      {
        limit: DEFAULT_LIMIT,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: true,
      }
    )
  );

  // Only load the specific short when a videoId is provided (e.g. user clicked a Short from grid)
  const specificQuery = videoId
    ? useSuspenseQuery(
        trpc.videos.getOne.queryOptions({ id: videoId, videoType: "short" })
      )
    : null;

  const infiniteShorts = videosQuery.data?.pages.flatMap((p) => p.items).filter((item) => item.videoType === 'short') || [];
 
  const shortsList = useMemo(() => {
    let list = [...infiniteShorts];

    if (videoId && specificQuery?.data) {
      const spec = specificQuery.data;
    
      list = list.filter((s) => s.id !== spec.id);
    
      list = [spec, ...list];
    }

    return list;
  }, [infiniteShorts, specificQuery?.data, videoId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentShort = shortsList[currentIndex];

  if (!currentShort) return null;

  // ──────────────────────────────────────────────────────────────
  // Mutations – now work with ANY current short and properly refresh both getOne + getMany
  // ──────────────────────────────────────────────────────────────
  const like = useMutation(
    trpc.videoReactions.like.mutationOptions({
      onSuccess: (_, variables) => {
        const { videoId: reactedId } = variables;
        queryClient.invalidateQueries({
          queryKey: trpc.videos.getOne.queryKey({ id: reactedId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.videos.getMany.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.playList.getLike.queryKey({ limit: DEFAULT_LIMIT }),
        });
        toast.success("Video liked successfully");
      },
      onError(error) {
        if (error.data?.code === "UNAUTHORIZED") {
          clerk.openSignIn();
          toast.error("You must sign in to like this video.");
        } else {
          toast.error("An error occurred while processing your reaction. Please try again.");
        }
      },
    })
  );

 

  const dislike = useMutation(
    trpc.videoReactions.dislike.mutationOptions({
      onSuccess: (_, variables) => {
        const { videoId: reactedId } = variables;
        queryClient.invalidateQueries({
          queryKey: trpc.videos.getOne.queryKey({ id: reactedId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.videos.getMany.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.playList.getLike.queryKey({ limit: DEFAULT_LIMIT }),
        });
        toast.success("Video disliked successfully");
      },
      onError(error) {
        if (error.data?.code === "UNAUTHORIZED") {
          clerk.openSignIn();
          toast.error("You must sign in to dislike this video.");
        } else {
          toast.error("An error occurred while processing your reaction. Please try again.");
        }
      },
    })
  );

  const createViewMutation = useMutation(
    trpc.videoViews.create.mutationOptions({
      onSuccess: (_, variables) => {
        const { videoId: viewedId } = variables;
        queryClient.invalidateQueries({
          queryKey: trpc.videos.getOne.queryKey({ id: viewedId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.videos.getMany.queryKey(),
        });
      },
    })
  );

  const handleVideoPlay = useCallback(() => {
    if (!isSignedIn) return;
    createViewMutation.mutate({ videoId: currentShort.id });
  }, [isSignedIn, createViewMutation, currentShort.id]);

  // YouTube-style navigation (exactly as requested)
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (videoId) {
      // If we opened a specific short from a grid / recommendation, go back to previous page
      router.back();
    }
    // Otherwise do nothing (you can't go before the first random short)
  }, [currentIndex, videoId, router]);

  const handleNext = useCallback(() => {
    const nextIdx = currentIndex + 1;

    if (nextIdx < shortsList.length) {
      // Move to already-loaded short in the session
      setCurrentIndex(nextIdx);
    } else if (videosQuery.hasNextPage && !videosQuery.isFetchingNextPage) {
      // Load the next random page and automatically advance (YouTube infinite behavior)
      videosQuery.fetchNextPage().then(() => {
        setCurrentIndex((prev) => prev + 1);
      });
    }
    // No more shorts → do nothing (very rare with a large DB)
  }, [currentIndex, shortsList.length, videosQuery]);

  const compctViews = useMemo(() => {
    return new Intl.NumberFormat("en", {
      notation: "compact",
    }).format(currentShort.viewCount);
  }, [currentShort.viewCount]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => setIsPlaying(false);

  const query = useSuspenseInfiniteQuery(
          trpc.comments.getMany.infiniteQueryOptions(
         {videoId: currentShort.id, limit: DEFAULT_LIMIT}, {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
         ))
         const comments = query.data;

  if (!currentShort.muxPlaybakId) {
    return (
      <div className="w-full h-full  flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg mb-2">No video available</p>
          <p className="text-sm text-gray-400">Click Revalidate to reload</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="h-screen flex justify-center relative w-full">
        {/* Left overlay – channel + title (kept exactly as your original UI) */}
        <div
          className={cn(
            "absolute bottom-[50px] z-50 left-0 right-1/3 p-4 md:bg-transparent bg-black/40 transition-opacity duration-300 opacity-100"
          )}
        >
          <div className="space-y-4">
            {/* Channel Info */}
            <div className="flex items-center gap-3">
              
              <VideoOwner  user={currentShort.user} video={currentShort} videoId={currentShort.id} />
            </div>

            {/* Video Title */}
            <p className="text-sm text-blue-600 md:text-blue-600  font-semibold line-clamp-2">
              {currentShort.title}
            </p>

            {/* Hashtags (YouTube Shorts style) */}
            <p className="text-muted-foreground text-xs line-clamp-2">
              #{currentShort.title.toLowerCase().replace(/\s+/g, "")} #shorts #youtube
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-4">
          {/* Video container – widened to feel more like real YouTube Shorts (original was too narrow) */}
          <div className="h-screen relative  aspect-[9/16] overflow-hidden rounded-3xl bg-secondary shadow-2xl">
            <MuxPlayer
              key={currentShort.id}
              ref={playerRef}
              playbackId={currentShort.muxPlaybakId ?? null}
              volume={volume}
              muted={isMuted}
              autoPlay={true}
              loop={true}
              onPlay={handleVideoPlay}
              className="absolute inset-0 z-40 w-full h-full object-fill"
              accentColor="#FF2056"
              streamType="on-demand"
              preferPlayback="native"
            />
          </div>

          <div className="md:flex hidden flex-col items-center space-y-2">
            {/* Like */}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition-all"
                disabled={like.isPending || dislike.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  like.mutate({ videoId: currentShort.id });
                }}
              >
                <ThumbsUpIcon
                  className={cn(
                    "size-5",
                    currentShort.viewerReaction === "like" && "fill-black"
                  )}
                />
              </Button>
              <span className="text-muted-foreground text-xs font-medium">
                {currentShort.likeCount}
              </span>
            </div>

            {/* Dislike */}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={like.isPending || dislike.isPending}
                className="bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  dislike.mutate({ videoId: currentShort.id });
                }}
              >
                <ThumbsDownIcon
                  className={cn(
                    "size-5",
                    currentShort.viewerReaction === "dislike" && "fill-black"
                  )}
                />
              </Button>
              <span className="text-muted-foreground text-xs font-medium">
                {currentShort.dislikeCount}
              </span>
            </div>

            {/* Comments */}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComments(true);
                }}
              >
                <MessageCircle className="size-5" />
              </Button>
              <span className="text-muted-foreground text-xs font-medium">{comments.pages[0].totalCount}</span>
            </div>

            {/* Share */}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // onShare logic can be added here
                }}
              >
                <Share2Icon className="size-5" />
              </Button>
              <span className="text-muted-foreground text-xs">Share</span>
            </div>

            {/* Remix */}
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm"
            >
              <Music2 className="h-6 w-6 rotate-12" />
            </Button>
          </div>
        </div>

        {/* Up / Down navigation – exactly like YouTube Shorts web player */}
        <div className=" md:flex absolute right-4 top-1/2 z-50 -translate-y-1/2 hidden flex-col gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/40 hover:bg-black/60 rounded-full h-10 w-10 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
          >
            <ChevronUp className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/40 hover:bg-black/60 rounded-full h-10 w-10 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          >
            <ChevronDown className="size-5" />
          </Button>
        </div>

        {showComments && <CommentsDrawer videoId={currentShort.id} onClose={() => setShowComments(false)} />}

        {/* Thin progress bar at bottom (YouTube Shorts aesthetic) */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
          <div className="h-full bg-red-600 w-0 animate-pulse" />
        </div>
      </div>
    </div>
  );
};