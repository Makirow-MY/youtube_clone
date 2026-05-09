"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff, Play, Search, Trash2 } from "lucide-react";
import {  useTRPC } from "@/trpc/client";
import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { DEFAULT_LIMIT } from "@/constants";
import { InfiniteScroll } from "@/components/infinte-scroll";
import { LikedHeader } from "../components/liked-header";
import { LikedSidebar } from "../components/liked-sidebar";
import { CategoriesSectionn } from "@/modules/home/ui/sections/categories-section";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";

interface LikedViewProps{
      categoryId?: string
} 
export const LikedSection = ( {categoryId}: LikedViewProps) => {
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
        <LikedSectionSuspense  categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const LikedSkeleton = () => {
  const isMobile = useIsMobile()

  return(
  <div className="p-2 flex flex-col lg:flex-row gap-8">
    <div className="lg:w-80 flex-shrink-0">
      <Skeleton className="aspect-video bg-muted rounded-xl" />
    </div>
     <div className="flex-1 flex flex-col gap-4 pl-10 pr-14 min-w-0">
    <div className="space-y-10">
    {
      isMobile ? (
        <>
        {Array.from({length: 10}).map((video) => (
              <VideoGridCardSkeleton  />
           
          ))}
        </>
      )

      :

      (<>
        {Array.from({length: 10}).map((video) => (
              <VideoRowCardSkeleton size="compact"  />
           
          ))}
        </>
        )
    }
    </div>
    </div>
  </div>
);
}

export const LikedSectionSuspense = ( {categoryId}: LikedViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
const [value, setValue] = useState(null);
const [cat, setcat] = useState(null);

const trpc = useTRPC();
 // const myUserId =  window.localStorage.getItem("MyUserId")

const videosQuery = useSuspenseInfiniteQuery(
    trpc.playList.getLike.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT, categoryId:categoryId,
      videoType: cat,
   //   myUserId,
     },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )
  );

const likeData = videosQuery.data;
  const allLikedVideos = likeData.pages.flatMap((page) => page.items);
const allLikedVideos1 = likeData.pages.flatMap((page) => page.latestLiked);
 const [api, setApi] = useState<CarouselApi>();
    const [currentValue, setCurrentValue] = useState(0); 
    const [count, setCount] = useState(0);

useEffect(()=>{
    if (!api) {
        return;
            }

    setCount(api.scrollSnapList().length)
    setCurrentValue(api.selectedScrollSnap() + 1 )

    api.on("select", () => {
        setCurrentValue(api.selectedScrollSnap() + 1)
    } 
)  
}, [api])

  // Get the most recently liked video for the left big thumbnail
  const latestLikedVideo = useMemo(() => {
    return allLikedVideos1.length > 0 ? allLikedVideos1[0] : null;
  }, [allLikedVideos1]);

  // Filter videos based on search
  const filteredVideos = useMemo(() => {
    if (!searchQuery) return allLikedVideos;
    const q = searchQuery.toLowerCase();
    return allLikedVideos.filter(
      (video) =>
        video.title.toLowerCase().includes(q) ||
        video.user.name.toLowerCase().includes(q)
    );
  }, [allLikedVideos, searchQuery]);

   const onSelect = (value: any) => {
        console.log("Selected category:", value);
        setValue(value.name)
        setcat(value.isShort)
        
    }

  return (
    <div className="flex h-screen overflow-hidden relative flex-col p-2 lg:flex-row gap-8">
      {/* LEFT SIDEBAR - Big Thumbnail + Info (YouTube Style) */}
      <div className=" lg:w-80 flex-shrink-0">
        <LikedSidebar latestVideo={latestLikedVideo} totalCount={latestLikedVideo?.videoCount ?? 0} />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 h-screen overflow-auto flex flex-col gap-4 md:pl-10 md:pr-14 pr-0 pl-0 min-w-0">
        <div className="relative w-full">
               <div 
                className={cn(
                   "absolute left-12 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none"
                , currentValue === 1 && "hidden"  
               )}
               />
             <Carousel
             setApi={setApi}
               opts={{
                 align: "start",
                 dragFree: true,
               }}
               className="w-full px-12"
             >
               <CarouselContent className="-ml-3">
           {!videosQuery.isLoading &&  (
                 <CarouselItem className="pl-3 basis-auto">
                   <Badge
                   variant={!value ? "default" : "secondary"}
                   onClick={() => onSelect({
                    name: null,
                    isShort:null,
                   })}
                   className="rounded-lg px-3 py-1 cursor-pointer text-sm whitespace-nowrap"
                   >All</Badge>
                 </CarouselItem>)}
       
                  
                 
                   {filteredVideos.length > 0 && [
                    {
                    name:"Videos",
                    isShort: false
                   },
                  {
                    name:"Shorts",
                    isShort: true
                   }
                  ].map((item) => (
                     <CarouselItem key={item.name} className="pl-3 basis-auto">
                       <Badge 
                        variant={value === item.name ? "default" : "secondary"}
                        onClick={() => onSelect(item)}
                         className="rounded-lg px-3 py-1 cursor-pointer text-sm whitespace-nowrap"
                  
                       >
                           <div className="w-full h-full">
                         {item.name}
                       </div>
                       </Badge>
                     </CarouselItem>
                   ))}
                 
               </CarouselContent>
       
               
             </Carousel>
             <div 
                className={cn(
                   "absolute right-12 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none",
                   currentValue === count && "hidden"
                 )}
               />
           </div>

          <div className="space-y-10">
          {filteredVideos.map((video) => (
            <div key={video.id} className="md:hidden">
              <VideoGridCard data={video} />
            </div>
          ))}

          {filteredVideos.map((video, index) => (
            <div key={video.id} className="hidden  items-center gap-2 md:flex">
              <span className="text-muted-foreground text-sm">{index + 1}</span>
             <div className="w-full">
               <VideoRowCard size="compact" data={video} />
             </div>
            </div>
          ))}

          {filteredVideos.length === 0 && searchQuery && (
            <p className="text-center text-muted-foreground py-12">
              No liked videos match your search.
            </p>
          )}
        </div>

        <InfiniteScroll
          hasNextPage={videosQuery.hasNextPage}
          fetchNextPage={videosQuery.fetchNextPage}
          isFetchingNextPage={videosQuery.isFetchingNextPage}
        />
      </div>

      {/* RIGHT ACTIONS PANEL
      <div className="w-full lg:w-72 flex-shrink-0">
        <LikedRightActions />
      </div> */}
    </div>
  );
};