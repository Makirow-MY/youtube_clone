"use client"
import { Suspense } from "react";
import { CategoriesSectionn } from "./categories-section";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { PlaySquareIcon, RefreshCw, UserCircleIcon, WifiOff } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { InfiniteScroll } from "@/components/infinte-scroll";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";

export const SubscriptionsVideosSection = () => {
     return  (

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
               <Suspense 
    fallback={
         <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:grid-cols-3" >
      {
        Array.from({length: 12}).map((_,index) =>
        (
            <VideoGridCardSkeleton key={index}/>
        ))
      }
    </div>
    } >
             <SubscriptionsVideosSectionSuspense />
               </Suspense>
        </ErrorBoundary>    
  
    );
}


export const SubscriptionsVideosSectionSuspense = () => {
   const isMobile = useIsMobile()
   const trpc = useTRPC();
 const  query = useSuspenseInfiniteQuery(trpc.videos.getManySubscribed.infiniteQueryOptions(
  { limit: DEFAULT_LIMIT}  ,
  {
     getNextPageParam: (lastpage) => lastpage.nextCursor,
  } 
 ))
 const videos = query.data
if (videos.pages.flatMap((p) => p.items).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-6 text-center">
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-muted/50 flex items-center justify-center">
            <PlaySquareIcon className="w-20 h-20 text-muted-foreground/60" strokeWidth={1.2} />
          </div>
          <div className="absolute -top-2 -right-2 bg-background border rounded-full p-2 shadow">
            <UserCircleIcon className="w-10 h-10 text-muted-foreground" />
          </div>
        </div>

        <h2 className="text-3xl font-semibold mb-3">No Subscriptions Yet</h2>
        
        <p className="text-muted-foreground max-w-md text-lg mb-10">
          You haven't subscribed to any channels yet. 
          Subscribe to your favorite creators to see their latest videos here.
        </p>

        <Button 
          size="lg" 
          className="rounded-full px-8 py-6 text-base font-medium"
          onClick={() => window.location.href = '/'} // or your browse page
        >
          Browse Channels
        </Button>

        <p className="text-xs text-muted-foreground mt-10">
          Discover amazing content from creators around the world
        </p>
      </div>
    );
  }

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
        <InfiniteScroll 
        hasNextPage={query.hasNextPage}
        fetchNextPage={query.fetchNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
    
        />
   </div>
  );
}