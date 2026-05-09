
import { ResponsiveModal } from "@/components/responsive-dialog";
import { UploadDropzone } from "@/lib/uploadthing";
import { PlaylistGetManyOutput } from "../../type";
import Link from "next/link";
import { PlaylistVideoThumnail, PlaylistVideoThumnailSkeleton } from "./playlist-video-thumbnail";
import { THUMBNAIL_FALLBACK } from "@/modules/videos/constants";
import { PlaylistInfo, PlaylistInfoSkeleton } from "./playlist-info";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, LucideSave } from "lucide-react";

interface PlaylistGridProps {
  data: PlaylistGetManyOutput["items"][number];
  className?: string;
}
export const PlaylistGridSkeleton = () => {


  return (
    <div className="flex flex-col gap-2 w-full">

      <PlaylistVideoThumnailSkeleton />
      <PlaylistInfoSkeleton />
    </div>

  )

}

export const PlaylistGrid = ({
  data, className
}: PlaylistGridProps) => {


  return (
    <div className="w-full flex items-center justify-between">
      <div className={`flex ${!className?.trim() ? "flex-col" : "flex-row items-center"} gap-4 w-full group`}>
        <PlaylistVideoThumnail
          imageUrl={data.thumbnailUrl ?? THUMBNAIL_FALLBACK}
          title={data.thumbnailUrl ?? data.name}
          className={className}
          videoId={data.videoId || null}
          playlistId={data.id}
          videoCount={data.videoCount}
        />

        <PlaylistInfo data={data} />
      </div>

      {className?.trim() && <Button size={"icon"} variant={"outline"} type="submit">
        <BookmarkIcon className="size-4" />
      </Button>}
    </div>
  )

}