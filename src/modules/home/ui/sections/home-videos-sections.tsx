"use client"
import { Suspense, useMemo } from "react";
import { CategoriesSectionn } from "../sections/categories-section";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw, User2Icon, VideoOffIcon, WifiOff, ZapIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { InfiniteScroll } from "@/components/infinte-scroll";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { ShortsSkeleton } from "./home-shorts-section";
import { ShortsGridCard } from "../../components/shorts-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { useClerk, useUser } from "@clerk/nextjs";



interface HomeVideosSectionProps {
  categoryId?: string;
  categoryType: string | "video" | "short";
  limit?: number;
}


export const HomeVideosSection = ({ categoryId, categoryType, limit }: HomeVideosSectionProps) => {
  const isMobile = useIsMobile()
 
      
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
              <>
              <ShortsSkeleton />
               <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="h-6 w-24" />
                 </div>
              <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:grid-cols-3" >
                {
                  Array.from({ length: !isMobile ? limit || 3 : 5 }).map((_, index) =>
                  (
                    <VideoGridCardSkeleton key={index} />
                  ))
                }
              </div>
              </>
          
        } >
        <HomeVideosSectionSuspense categoryId={categoryId} limit={limit} categoryType={categoryType} />
      </Suspense>
    </ErrorBoundary>

  );
}


export const HomeVideosSectionSuspense = ({ categoryId, categoryType, limit }: HomeVideosSectionProps) => {
  const isMobile = useIsMobile()
  const trpc = useTRPC();
  const clerk = useClerk();
    const { user } = useUser();
 //const myUserId =  window.localStorage.getItem("MyUserId")
//console.log({myUserId})
  const videosQuery = useSuspenseInfiniteQuery(
    trpc.videos.getMany.infiniteQueryOptions(
      {
        limit: limit || DEFAULT_LIMIT,
        categoryId,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: true
      }
    )
  );

  const shorts = videosQuery.data.pages.flatMap((p) => p.items);

   const infiniteShorts = shorts || [];
   
    const shortsList = useMemo(() => {
     
      return [...infiniteShorts];
    }, [infiniteShorts, videosQuery.data]);

 // console.log(shorts)

  if (shortsList.length === 0) return  <div className="flex flex-col items-center justify-center min-h-[70vh] py-20 px-6 text-center">
        <div className="relative mb-10">
          <div className="w-40 h-40 rounded-full bg-muted/60 flex items-center justify-center">
            <VideoOffIcon className="w-28 h-28 text-muted-foreground/50" strokeWidth={1.1} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-background p-3 rounded-full shadow-lg border">
            <Clock className="w-10 h-10 text-muted-foreground" />
          </div>
        </div>
  
        <h2 className="text-3xl font-semibold mb-3">No video found</h2>
        <p className="text-muted-foreground max-w-md text-lg mb-10">
          Videos you and other creator publish, will appear here. Start be the first to publish a video!
        </p>
  
        <Button 
          size="lg" 
          className="rounded-full px-10 py-6 text-base font-medium"
          onClick={() => {
                if(user && user.id){
                  window.location.href = '/studio/content';
                }
                else{
                  clerk.openSignIn()
                }
          }}
        >
          Publish Video
        </Button>
  
        <p className="text-xs text-muted-foreground mt-12">
          Your publish videos will be visible to all
        </p>
      </div>;

  return (
    <div>
        {
        shortsList.filter((short) => short.videoType === "short").length > 0 && 
        <>
        <div className="flex items-center gap-3">
                <ZapIcon className="size-5 fill-red-500 text-red-500" />
                                <h2 className="text-xl font-semibold">Shorts</h2>
                              </div>
        <div className="flex gap-4 overflow-x-auto pb-3 px-1">
          {shorts.filter((short) => short.videoType === "short").map((short) => (
            <div key={short.id} className="flex-shrink-0 w-44">
              <ShortsGridCard data={short} />
            </div>
          ))}
        </div>
        </>
      }
      {shorts.filter((short) => short.videoType === "video").length > 0 &&
<>
 <div className="flex items-center gap-3 py-3">
                        <h2 className="text-xl font-semibold">For You</h2>
                      </div>

        <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:grid-cols-3" >
          {
            shorts.filter((short) => short.videoType === "video").map((video) =>
            (
              <VideoGridCard key={video.id} data={video} />
            ))
          }
        </div>
        </>
      }
    
    </div>
  );
}