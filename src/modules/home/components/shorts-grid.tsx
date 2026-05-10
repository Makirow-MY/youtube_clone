"use client";

import Link from "next/link";

import { UserAvatar } from "@/components/user-avatar";
import { UserInfo } from "@/modules/users/ui/components/user-info";

import { formatDistanceToNow } from "date-fns";
import { ZapIcon } from "lucide-react";
import { VideoGetManyOutput } from "@/modules/videos/types";
import { VideoThumnail } from "@/modules/videos/ui/components/video-thumbnail";

interface ShortsGridCardProps {
  data: any; // VideoGetManyOutput["items"][number];
}

export const ShortsGridCard = ({ data }: ShortsGridCardProps) => {
  const compactViews = new Intl.NumberFormat("en", { notation: "compact" }).format(data.viewCount);

  return (
    <div className="flex flex-col w-full gap-2 group">
      <a href={`/shorts/${data.id}`}>
        <div className="relative ">
          <VideoThumnail
            imageUrl={data.thumbnailUrl}
            previewUrl={data.previewUrl}
            title={data.title}
            duration={data.duration ?? 0}
            isShort={true}
            isChange={true}
          />
        
        </div>
      </a>

      <div className="flex gap-3">
        <a href={`/users/${data.user.id}`}>
          <UserAvatar imageUrl={data.user.imageUrl} name={data.user.name} size="sm" />
        </a>

        <div className="flex-1 min-w-0">
          <a href={`/shorts/${data.id}`}>
            <h3 className="font-medium line-clamp-2 text-sm leading-tight">{data.title}</h3>
          </a>

          <a href={`/users/${data.user.id}`}>
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