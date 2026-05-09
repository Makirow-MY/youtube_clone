import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDuration } from "@/lib/utils";
import { THUMBNAIL_FALLBACK } from "@/modules/videos/constants";
import { ListVideoIcon, Loader, PlayIcon } from "lucide-react";
import Image from "next/image"
import { useMemo } from "react";

interface PlaylistVideoThumbnailProps {
    imageUrl?: string | null; 
    title: string ;
    playlistId?: string;
    videoId?: string | null;
     videoCount: number;
     className?: string; 
}


export const PlaylistVideoThumnailSkeleton = () => {
     
    return (
        <div className={"relative w-full overflow-hidden rounded-xl aspect-video"}>
             <Skeleton className="size-full" />
        </div>
    )
}



export const PlaylistVideoThumnail = ({imageUrl, className, videoCount, title, playlistId, videoId}: PlaylistVideoThumbnailProps) => {
      const compctViews = useMemo (() => {
          return new Intl.NumberFormat("en", {
              notation: "compact",
           //   compactDisplay: "short"
          }).format(videoCount)
      }, [videoCount]
    )
    return (
        <div className={
            cn("relative pt-3 group", className)
        }>
                <div className="relative">
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-[97%] overflow-hidden rounded-xl bg-black/20 aspect-video" />
   <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-[98.5%] overflow-hidden rounded-xl bg-black/25 aspect-video" />
 <div className="relative overflow-hidden w-full rounded-xl aspect-video">
 <Image
 src={imageUrl || THUMBNAIL_FALLBACK}
 alt={title}
 className="w-full h-full object-cover"
 fill
 />

 <a href={`/playlist/${playlistId}/${videoId}`} className="absolute inset-0 transition-opacity flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100">
    {!className?.trim()  && <div  className="flex items-center gap-x-2 hover:bg-purple-400">
           <PlayIcon className="size-4 text-white fill-white" />
           <span className="text-white font-medium">Play All</span>
    </div>}
 </a>

 </div>
                </div>

                {!className?.trim()  && <a href={`/playlist/${playlistId}`} className="absolute bg-black/80 flex items-center gap-x-1 text-white text-xs bottom-2 right-2 px-2 py-0.5 rounded">
                     <ListVideoIcon className="size-4" />
             {compctViews} videos
                </a>}
        </div>
    )
}