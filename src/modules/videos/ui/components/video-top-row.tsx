import { AlertTriangleIcon } from "lucide-react";
import { VideoGetOneOutput } from "../../types";
import { VideoOwner } from "./video-owner";
import { VideoReactions } from "./video-reactions";
import VideoMenu from "./video-menu";
import { VideoDescription } from "./video-description";
import { useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";


interface VideoTopRowProps{
    video: VideoGetOneOutput
}


export const VideoTopRow = ({video}: VideoTopRowProps) => {

    const compctViews = useMemo (() => {
        return new Intl.NumberFormat("en", {
            notation: "compact",
         //   compactDisplay: "short"
        }).format(video.viewCount)
    }, [video.viewCount]) 
    
    const compctDate = useMemo (() => {
        return formatDistanceToNow(video.createdAt, {addSuffix: true})
    }, [video.createdAt]) 

    const expandedDate = useMemo (() => {
        return format(video.createdAt, "d MMMM yyyy")
    }, [video.createdAt]) 

     const expandedViews = useMemo (() => {
          return new Intl.NumberFormat("en", {
            notation: "standard",
          //  compactDisplay: "short"
        }).format(video.viewCount)
    }, [video.viewCount]) 

    return (    
    <div className=" flex flex-col mt-4 gap-4 ">
            <h1 className="text-xl font-semibold">{video.title}</h1>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <VideoOwner user={video.user} videoId={video.id} />
      
            <div className="flex overflow-x-auto sm:min-w-[calc(50%-6px)] sm:justify-end sm:overflow-visible pb-2 -mb-2 sm:pb-0 sm-mb-0 gap-2">
                     <VideoReactions
                     videoId={video.id}
                     likes={video.likeCount}
                     dislikes={video.dislikeCount}
                     viewerReaction={video.viewerReaction}

                     />  
                     <VideoMenu
                     onRemove={() => {}}
                     videoId={video.id}
                     variant="secondary"
                     />     
            </div>
        </div>

        <VideoDescription
    compactViews={compctViews}
    compactDate={compctDate}
    expandedViews={expandedViews}
    expandedDate={expandedDate}
    description={video.description} />

       
    </div>
  );
}