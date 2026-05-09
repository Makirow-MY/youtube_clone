import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { PlaylistGetManyOutput } from "../../type";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserInfoProps  {
 data: PlaylistGetManyOutput["items"][number];
  
}

export const PlaylistInfoSkeleton = () =>{

    return(
        <div className={"flex gap-3"}>
              <div className={"min-w-0 space-y-2 flex-1"}>
             <Skeleton className="h-5 w-[90%]" />
         <Skeleton className="h-5 w-[70%]" />
         <Skeleton className="h-5 w-[50%]" />
         </div>
        </div>
    )
} 

export const PlaylistInfo = ({
data,

}: UserInfoProps) =>{

    return(
        <a className={"flex gap-3"} href={`/playlist/${data.id}`}>
              <div className={"min-w-0 flex-1"}>
              <h3 className={"font-semibold line-clamp-1 lg:line-clamp-2 text-sm break-words"}>
             {data.name}
        </h3>
         <p className="text-sm text-muted-foreground">{data.videoVisibility}</p>
         <p className="text-sm font-semibold hover:text-primary text-muted-foreground">View full playlist</p>
        </div>
        </a>
    )
} 

