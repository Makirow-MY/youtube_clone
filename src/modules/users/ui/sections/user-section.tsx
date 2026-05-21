
"use client"
import { Button } from "@/components/ui/button";
import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import { useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { RefreshCwIcon, WifiOff } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { UserPageBanner } from "../components/user-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPageInfo, UserPageInfoSkeleton } from "../components/user-pade-info";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ShortGridCard } from "@/modules/videos/ui/components/short-grid-card";
import { FilterCarousel } from "@/components/filter-carousel";

interface PagePops{
    userId: string;
}

export const UserSection = ({userId}: PagePops) => {

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
            <RefreshCwIcon className="h-4 w-4" />
            Retry
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            If the problem continues, check your network or try again later.
          </p>
        </div>
      )}
    >
      <Suspense fallback={
        <div className="flex relative justify-center flex-col w-[100%] items-center gap-y-6 md:px-12 px-6">
        <Skeleton className="w-[90%] h-[200px]" />
        <UserPageInfoSkeleton />
        <FilterCarousel isLoading={true} onSelect={() => { }} data={[]} />
         <div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:grid-cols-3" >
                   {
                     Array.from({ length: 12 }).map((_, index) =>
                     (
                       <VideoGridCardSkeleton key={index} />
                     ))
                   }
        </div>
    </div>
      }>

        <UserSectionSuspense userId={userId} />

      </Suspense>
    </ErrorBoundary>


  )

}

export const UserSectionSuspense =({userId}: PagePops) => {
      const trpc = useTRPC();
      const queryClient = useQueryClient();
     // const myUserId = window.localStorage.getItem("MyUserId")
    
      const query = useSuspenseQuery(
        trpc.users.getOne.queryOptions({ userId : userId || null})
      );
const myInfo = query.data;

  const user = myInfo.user;
  const videos = myInfo?.videos;
  const [value, setValue] = useState(null);
  const [cat, setcat] = useState(null);
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

    const onSelect = (value: any) => {
       // console.log("Selected category:", value);
        setValue(value.name)
        setcat(value.isShort)
        
    }
    return(
        <div className="flex relative justify-center flex-col w-[100%] items-center gap-y-6 md:px-12 px-6">
            <UserPageBanner user={user}/>
            <UserPageInfo  user={user} />

             <div className="relative w-full">
                                    
                                     <Carousel
                                     setApi={setApi}
                                       opts={{
                                         align: "start",
                                         dragFree: true,
                                       }}
                                       className="w-full px-12"
                                     >
                                       <CarouselContent className="-ml-3">
                                         <CarouselItem className="pl-3 basis-auto">
                                           <Badge
                                           variant={!value ? "default" : "secondary"}
                                           onClick={(e) => {
                                            e.preventDefault();
                                            onSelect({
                                            name: null,
                                            isShort:null,
                                            
                                           })}}
                                           className="rounded-lg px-3 py-1 cursor-pointer text-sm whitespace-nowrap"
                                           >Home</Badge>
                                         </CarouselItem>
                                          {videos && videos.length > 0 && [
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
                                                onClick={(e) => {onSelect(item);
                                                    e.preventDefault()
                                                }}
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
                                  
                                   </div>
             <div className="w-full gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:grid-cols-3" >
                      {
                        videos && cat === false && videos.filter((short) => short.videoType === "video").map((video) =>
                        (
                          <VideoGridCard key={video.id} data={video} />
                        ))
                      }
                      {
                        videos && cat === true && videos.filter((short) => short.videoType === "short").map((video) =>
                        (
                          <ShortGridCard key={video.id} data={video} />
                        ))
                      }
                      {
                        videos && cat === null && videos.map((video) =>
                        (
                          <VideoGridCard key={video.id} data={video} />
                        ))
                      }
                    </div>
        </div>    
    )
}



