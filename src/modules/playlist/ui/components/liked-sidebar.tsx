"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Play, PlayIcon, Shuffle, ShuffleIcon } from "lucide-react";
import Link from "next/link";
import { VideoThumnail } from "@/modules/videos/ui/components/video-thumbnail";
import { useMemo } from "react";
import { format } from "date-fns";

interface LikedSidebarProps {
  latestVideo: any | null;
  totalCount: number | 0 | null;
}

export function LikedSidebar({ latestVideo, totalCount = 0 }: LikedSidebarProps) {
  const expandedDate = useMemo (() => {
         return format(latestVideo.updatedAt, "d MMMM yyyy")
     }, [latestVideo.updatedAt]) 
 
    if (!latestVideo) {
    return (
      <div className="sticky top-20">
        <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
          <p className="text-muted-foreground">No liked videos yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky bg-border p-6 flex flex-col gap-4 rounded-lg min-w-0 sapce-y-10">
      <div className="relative group aspect-video bg-black rounded-xl overflow-hidden cursor-pointer">
        <Image
          src={latestVideo.thumbnailUrl || "/placeholder-thumbnail.jpg"}
          alt={latestVideo.title}
          fill
          className="object-cover"
        />

        {/* Play All Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button size="lg" className="rounded-full gap-2" asChild>
            <a href={`/playlist/liked`}>
              <Play className="size-5 fill-white" />
              Play all
            </a>
          </Button>
        </div>
      </div>
       <h2 className="font-bold text-xl">Liked videos</h2>
       
        <div>
        <h2 className="font-medium text-sm">{latestVideo.user.name}</h2>
        <p className="text-xs text-muted-foreground">{totalCount && totalCount > 0 ? totalCount : "No"} videos {latestVideo.viewCount > 0 ? latestVideo.viewCount : "No" } views  Last updated on {expandedDate}</p>
      </div>

     <div className="flex items-center gap-2">
        <Button variant="secondary" className="w-full rounded-full" asChild>
        <a href="/playlist/liked" className="flex items-center gap-2">
         <Play className="size-5 fill-white" />
        Play All</a>
      </Button>
       <Button variant="secondary" className="w-full rounded-full" asChild>
        <a href="/playlist/liked">
         <Shuffle className="size-5 fill-white" />
        Shuffle</a>
      </Button>
     </div>
    </div>
  );
}