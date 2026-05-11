import { formatDuration } from "@/lib/utils";
import { Loader } from "lucide-react";
import Image from "next/image"
import { THUMBNAIL_FALLBACK } from "../../constants";


interface VideoThumbnailProps {
    imageUrl?: string | null; 
    previewUrl?: string | null;
     title: string ;
     duration: number;
     isShort?: boolean;
    isChange?: boolean;
}






export const VideoThumnail = ({imageUrl, isChange = false, isShort, duration, previewUrl, title}: VideoThumbnailProps) => {
// // console.log({imageUrl, isChange, isShort, duration, previewUrl, title})
    return (
        <div className="relative group">
                <div  className={`relative  bg-black/50 overflow-hidden rounded-xl w-full ${!isChange ? "aspect-video " : "aspect-[3/4]"}`}>
                    <Image loading="lazy"
                     fill 
                     className={` size-full ${!isShort ? "object-cover " : isChange ? "object-fill" : "object-contain"} group-hover:opacity-0`} alt={title} src={imageUrl ? imageUrl :THUMBNAIL_FALLBACK} />
              
              <Image loading="lazy"
              unoptimized={!!previewUrl}
                     fill 
                     className={` ${!isShort ? "object-cover "  : isChange ? "object-fill" : "object-contain"} size-full opacity-0 group-hover:opacity-100`} alt={title} src={previewUrl ? previewUrl :THUMBNAIL_FALLBACK} />
              
                </div>

                <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
                {formatDuration(duration)}
                </div>
        </div>
    )
}