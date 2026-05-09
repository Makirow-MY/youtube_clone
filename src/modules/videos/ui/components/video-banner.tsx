import { AlertTriangleIcon } from "lucide-react";
import { VideoGetOneOutput } from "../../types";


interface VideoBannerProps{
    status: VideoGetOneOutput["muxStatus"]
}


export const VideoBanner = ({status}: VideoBannerProps) => {
  if(status === "ready") return null;

    return (
    <div className=" px-4 py-3 rounded-b-xl bg-yellow-500 flex items-center gap-2 ">

        <AlertTriangleIcon className="size-4 text-black shrink-0" />

        <p className="text-xs md:text-sm font-medium line-clamp-1 text-black">
            This video is still being processed
        </p>
       
    </div>
  );
}