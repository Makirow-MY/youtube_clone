"use client"

import { useTRPC } from "@/trpc/client";
import { CategoriesSection } from "../sections/categories-section";
import { DEFAULT_LIMIT } from "@/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";
import { InfiniteScroll } from "@/components/infinte-scroll";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";

interface SearchViewProps{
    query: string | undefined;
    categoryId: string | undefined;
}

export  const ResultSection  = ({query, categoryId }: SearchViewProps) => {
    return  (
    <Suspense
    key={`${query}_${categoryId}`}
    fallback={
<ResultSectionSkeleton />
 } >
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
             <ResultSectionSuspense query={query} categoryId={categoryId} />
        </ErrorBoundary>    
    </Suspense>
    );
}

const  ResultSectionSkeleton = () => {

    return(
        <div>
            <div className="hidden flex-col gap-4 md:flex">
{
    Array.from({length: 6}).map((_,index) =>(
        <VideoRowCardSkeleton key={index} />
    ))
}
            </div>
             <div className="flex p-4 pt-6 gap-y-10 flex-col gap-4 md:hidden">
                {
    Array.from({length: 6}).map((_,index) =>(
        <VideoGridCardSkeleton key={index} />
    ))
}
            </div>
        </div>
    )
  
}

export const ResultSectionSuspense  = ({query, categoryId }: SearchViewProps) => {
  const isMobile = useIsMobile()
    const trpc = useTRPC();   
  
const resultQuery = useSuspenseInfiniteQuery(trpc.search.getMany.infiniteQueryOptions(
 {query, categoryId, limit: DEFAULT_LIMIT}  ,
 {
    getNextPageParam: (lastpage) => lastpage.nextCursor,
 } 
))

const result = resultQuery.data;

    return(
      <>
      {
        isMobile && (
              <div className="flex flex-col gap-4 gap-y-10">
         {
            result.pages.flatMap((page) => page.items).map((video) => (
                <VideoGridCard data={video} key={video.id}  />
            ))
         }
         </div>
        )
      }

      {
        !isMobile && (
              <div className="flex flex-col gap-4">
         {
            result.pages.flatMap((page) => page.items).map((video) => (
                <VideoRowCard data={video} key={video.id}  />
            ))
         }
         </div>
        )
        
      }

      <InfiniteScroll
      hasNextPage={resultQuery.hasNextPage}
      isFetchingNextPage= {resultQuery.isFetchingNextPage}
      fetchNextPage={resultQuery.fetchNextPage}
      />
      </>
    )
}
