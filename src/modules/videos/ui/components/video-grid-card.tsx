import { cva, type VariantProps } from "class-variance-authority";
import { VideoGetManyOutput } from "../../types";
import Link from "next/link";
import { VideoThumnail } from "./video-thumbnail";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { UserAvatar } from "@/components/user-avatar";
import { UserInfo } from "@/modules/users/ui/components/user-info";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import VideoMenu from "./video-menu";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";


interface VideoRowCardProps {
   data: any; // VideoGetManyOutput["items"][number];
   playlistId?:string
   onRemove?: () => void;
}
 

export const VideoGridCardSkeleton = () => {
  return (
    <div className="flex w-full flex-col gap-2 group">
      {/* Thumbnail */}
      <Skeleton className="w-full aspect-video rounded-xl" />

      <div className="flex gap-3">
        {/* Avatar */}
        <Skeleton className="h-8 w-8 rounded-full flex-none mt-0.5" />

        <div className="flex-1 min-w-0 space-y-2">
          {/* Title */}
          <Skeleton className="h-4 w-[90%] rounded" />
          <Skeleton className="h-4 w-[65%] rounded" />

          {/* User name */}
          <Skeleton className="h-3 w-28 rounded" />

          {/* Metadata */}
          <Skeleton className="h-3 w-40 rounded" />
        </div>

        </div>
    </div>
  );
};

export const VideoGridCard = ({data, playlistId, onRemove}: VideoRowCardProps) => {
  
 const compctViews = useMemo (() => {
        return new Intl.NumberFormat("en", {
            notation: "compact",
         //   compactDisplay: "short"
        }).format(data.viewCount)
    }, [data.viewCount]) 

     const compctLikes = useMemo (() => {
        return new Intl.NumberFormat("en", {
            notation: "compact",
         //   compactDisplay: "short"
        }).format(data.likeCount)
    }, [data.likeCount])
    
    return (
        <div className={"flex w-full flex-col gap-2 group"}>
            <a href={playlistId ? `/playlist/${playlistId}/${data.id}` : data.videoType === "short" ? `/shorts/videos/${data.id}` :  `/videos/${data.id}`}  >
                            <VideoThumnail 
                            imageUrl={data.thumbnailUrl}
                            previewUrl={data.previewUrl}
                            title={data.title}
                            isChange={false}
                            isShort={data.videoType === "short"}
                            duration={data.duration ?? 0}
                            />    

            </a>
            
                                <div className="flex gap-3">
                                        <a href={`/users/${data.user.id}`} >
                                        <UserAvatar  imageUrl={data.user.imageUrl} name={data.user.name} />
                                       
                                        </a>
                                <div className="flex-1 min-w-0">
                                      <a href={playlistId ? `/playlist/${playlistId}/${data.id}` : `/videos/${data.id}`} >
                                    <h3 className="font-semibold line-clamp-1 lg:line-clamp-2 text-base break-words">{data.title}</h3>
                                       
                                        </a>

                                        <a href={`/users/${data.user.id}`} >
                                        <UserInfo   name={data.user.name} />
                                       
                                        </a>
                                         <a  href={playlistId ? `/playlist/${playlistId}/${data.id}` : `/videos/${data.id}`}>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {compctViews} views • {compctLikes} likes •  {formatDistanceToNow(data.createdAt, {addSuffix: true})}
                                    </p>
                                       
                                        </a>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <VideoMenu data={data} videoId={data.id} variant="ghost" onRemove={onRemove} />
                                    </div>
                                       
                                </div>
                              
        </div>
    );
}