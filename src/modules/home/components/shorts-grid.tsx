"use client";

import Link from "next/link";

import { UserAvatar } from "@/components/user-avatar";
import { UserInfo } from "@/modules/users/ui/components/user-info";

import { formatDistanceToNow } from "date-fns";
import { ZapIcon } from "lucide-react";
import { VideoGetManyOutput } from "@/modules/videos/types";
import { VideoThumnail } from "@/modules/videos/ui/components/video-thumbnail";
import Image from "next/image";
import { THUMBNAIL_FALLBACK } from "@/modules/videos/constants";
import { formatDuration } from "@/lib/utils";

interface ShortsGridCardProps {
  data: any; // VideoGetManyOutput["items"][number];
}

export const ShortsGridCard = ({ data }: ShortsGridCardProps) => {
  const compactViews = new Intl.NumberFormat("en", { notation: "compact" }).format(data.viewCount);

  return (
    <div className="flex flex-col w-full gap-2 group">
      <a href={`/shorts/${data.id}`}>
        <div className="relative ">
          
               <div className="relative group">
                          <div  className={`relative  bg-black/50 overflow-hidden rounded-xl w-full aspect-[3/4]`}>
                              <Image loading="lazy"
                               fill 
                               className={` size-full object-fill  group-hover:opacity-0`} alt={data.title} src={data.thumbnailUrl ? data.thumbnailUrl :THUMBNAIL_FALLBACK} />
                        
                        <Image loading="lazy"
                        unoptimized={!!data.previewUrl}
                               fill 
                               className={` object-fill size-full opacity-0 group-hover:opacity-100`} alt={data.title} src={data.previewUrl ? data.previewUrl :THUMBNAIL_FALLBACK} />
                        
                          </div>
          
                          <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
                          {formatDuration(data.duration ?? 0)}
                          </div>
                  </div>

        
        </div>
      </a>

      <div className="flex gap-3">
        <a href={`/user/${data.user.clerkId}`}>
          <UserAvatar imageUrl={data.user.imageUrl} name={data.user.name} size="sm" />
        </a>

        <div className="flex-1 min-w-0">
          <a href={`/shorts/${data.id}`}>
            <h3 className="font-medium line-clamp-2 text-sm leading-tight">{data.title}</h3>
          </a>

          <a href={`/user/${data.user.clerkId}`}>
            <UserInfo name={data.user.name} className="text-xs" />
          </a>

          <p className="text-xs text-muted-foreground">
            {compactViews} views • {formatDistanceToNow(data.createdAt, { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
};