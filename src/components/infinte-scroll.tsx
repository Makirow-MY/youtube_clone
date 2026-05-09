import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronDown, Loader2Icon } from "lucide-react";

interface InfiniteScrollProps {
    isManual?: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
}


export const InfiniteScroll = ({isManual= false,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,

}: InfiniteScrollProps) => {
    
    const {targetRef, isInter} = useIntersectionObserver({
        threshold: 0.5,
        rootMargin: "100px"
    });

    useEffect(() => {
      if (isInter  && hasNextPage && !isFetchingNextPage  && !isManual)  {
       fetchNextPage(); 
      }
    },[ isFetchingNextPage, isInter, isManual, hasNextPage])

return(
    <div className="flex p-4 items-center gap-4 flex-col">
        <div ref={targetRef} className="h-1" />
        {
            hasNextPage ?(<Button
            variant={"secondary"}
            className="flex items-center gap-2"
            disabled={!hasNextPage || isFetchingNextPage}
            onClick={() => fetchNextPage()}
            >
               {
                 isFetchingNextPage ? <>
                  <Loader2Icon className="animate-spin" />
                  <span>Loading...</span>
                 </> : <>
                  <ChevronDown />
                  <span>Load More</span>
                 </>
               }
            </Button> ) : ( 
                <p className="text-xs text-muted-foreground">You have reached the end of the list</p>
            )
        }
    </div>
)

}