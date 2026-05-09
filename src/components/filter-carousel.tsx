"use client";

import {
  Carousel,
  CarouselApi,
  CarouselItem,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface FilterProps {
  value?: string | null;
  isLoading?: boolean;
  onSelect: (value: string | null) => void;
  data: {
    value: string;
    label: string;
  }[];
}

export const FilterCarousel = ({
  value,
  onSelect,
  data,
  isLoading,
}: FilterProps) => {
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
   // console.log("rendering filter carousel with value:", isLoading, value);
  return (
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
    {!isLoading &&  (
          <CarouselItem className="pl-3 basis-auto">
            <Badge
            variant={!value ? "default" : "secondary"}
            onClick={() => onSelect(null)}
            className="rounded-lg px-3 py-1 cursor-pointer text-sm whitespace-nowrap"
            > <a href={`/`} className="w-full h-full">
                  All
                </a> </Badge>
          </CarouselItem>)}

            {
              isLoading &&   Array.from({ length: 10 }).map((_, index) => (  
                    <CarouselItem key={index} className="pl-3 basis-auto">
                       <Skeleton className="h-full w-[100px] px-3 py-1 text-sm font-semibold  rounded-lg">
                             &nbsp;
                        </Skeleton>
                    </CarouselItem>
                 )) 
            }
          
            {!isLoading && data.map((item) => (
              <CarouselItem key={item.value} className="pl-3 basis-auto">
                <Badge 
                 variant={value === item.value ? "default" : "secondary"}
                 onClick={() => onSelect(item.value)}
                  className="rounded-lg px-3 py-1 cursor-pointer text-sm whitespace-nowrap"
           
                >
                    <a href={`/?categoryId=${item.value}`} className="w-full h-full">
                  {item.label}
                </a>
                </Badge>
              </CarouselItem>
            ))}
          
        </CarouselContent>

        {!isLoading && (
            <><CarouselPrevious className="left-0 z-20"/> 
          <CarouselNext className="right-0 z-20" />
          </>)}
      </Carousel>
      <div 
         className={cn(
            "absolute right-12 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none",
            currentValue === count && "hidden"
          )}
        />
    </div>
  );
};