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
import { ArrowBigLeft, ArrowBigRight, Play } from "lucide-react";

export const videoRowCardVariants = cva("flex group min-w-0", {
    variants: {
        size: {
            default: "gap-4 hover:bg-secondary rounded-lg  p-2",
            compact: "gap-2 hover:bg-secondary rounded-lg p-1",
            veryCompact: "gap-2 flex items-center hover:bg-accent rounded-lg p-2"
        }
    },
    defaultVariants: {
        size: "default"
    }
});

export const videoRowCardVariantsSke = cva("flex group min-w-0", {
    variants: {
        size: {
            default: "gap-4 rounded-lg  p-2",
            compact: "gap-2 rounded-lg p-1",
            veryCompact: "gap-2 rounded-lg p-1"
        }
    },
    defaultVariants: {
        size: "default"
    }
});
const thumbnailVariants = cva("relative flex-none", {
    variants: {
        size: {
            default: "w-[30%]",
            compact: "w-[148px]",
            veryCompact: "w-[120px]"
        }
    },
    defaultVariants: {
        size: "default"
    }
});


interface VideoRowCardProps extends VariantProps<typeof videoRowCardVariants> {
    data: any; // VideoGetManyOutput["items"][number];
    playlistId?: string;
    videoId?: string;
    onRemove?: () => void;
    index?:number;

}

export const VideoRowCardSkeleton = ({ size = "default" }: { size?: "default" | "compact" | "veryCompact" }) => {
    return (
        <div className={videoRowCardVariantsSke({ size })}>
            {/* Thumbnail Skeleton */}
            <div className={thumbnailVariants({ size })}>
                <Skeleton className="w-full aspect-video rounded-xl" />
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-x-2">
                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Title */}
                        <Skeleton className={cn(
                            "h-4 w-[85%] rounded",
                            size === "compact" ? "h-3.5" : "h-5"
                        )} />

                        {/* Metadata (views, likes, time) - only on default size */}
                        {size === "default" && (
                            <Skeleton className="h-3 w-48 rounded" />
                        )}

                        {/* User Info Row */}
                        <div className="flex items-center gap-2 mt-3">
                            <Skeleton className="h-6 w-6 rounded-full" /> {/* Avatar */}
                            <Skeleton className="h-3.5 w-32 rounded" />   {/* User name */}
                        </div>

                        {/* Extra metadata on compact */}
                        {size === "compact" && (
                            <Skeleton className="h-3 w-44 rounded mt-1" />
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}


export const VideoRowCard = ({ data, index= 0, size = "default", playlistId, videoId, onRemove }: VideoRowCardProps) => {
    const compctViews = useMemo(() => {
        return new Intl.NumberFormat("en", {
            notation: "compact",
            //   compactDisplay: "short"
        }).format(data.viewCount)
    }, [data.viewCount])

    const compctLikes = useMemo(() => {
        return new Intl.NumberFormat("en", {
            notation: "compact",
            //   compactDisplay: "short"
        }).format(data.likeCount)
    }, [data.likeCount])

    return (
        <div className={videoRowCardVariants({ size }) + (playlistId && videoId === data.id ? "bg-red-500/20 cursor-pointer" : "bg-transparent cursor-pointer")}>
           
            <div className={"flex items-center gap-1"}>
                {playlistId && videoId === data.id &&  <Play className="size-4" />}
                {playlistId && videoId !== data.id && <p className="text-xs text-muted-foreground">{index + 1}</p>}
                <a href={playlistId ? `/playlist/${playlistId}/${data.id}` : `/videos/${data.id}`} className={thumbnailVariants({ size })} >
                    <VideoThumnail
                        imageUrl={data.thumbnailUrl}
                        previewUrl={data.previewUrl}
                        title={data.title}
                        isShort={data.videoType === "short"}
                        duration={data.duration ?? 0}
                    />

                </a>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-x-2">
                    <a href={playlistId ? `/playlist/${playlistId}/${data.id}` : `/videos/${data.id}`} className="flex-1 min-w-0">
                        <h3 className={cn("font-semibold line-clamp-2",
                            (size === "veryCompact" || size === "compact") ? "text-sm" : "text-base"
                        )}>{data.title}</h3>
                        {
                            size === "default" && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {compctViews} views •  {formatDistanceToNow(data.createdAt, { addSuffix: true })}
                                </p>
                            )
                        }
                        {
                            size === "default" && (
                                <>
                                    <div className="flex items-center gap-2 my-3">
                                        <UserAvatar size={"sm"} imageUrl={data.user.imageUrl} name={data.user.name} />
                                        <UserInfo size={"sm"} name={data.user.name} />
                                    </div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className=" w-fit line-clamp-2 text-muted-foreground text-xs">{data.description || "No description available."}</p>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="bottom"
                                            align="center"
                                            className="bg-black/70"
                                        >
                                            <p>{data.description}</p>
                                        </TooltipContent>

                                    </Tooltip>
                                </>
                            )
                        }
                        {
                            (size === "compact" || size === "veryCompact") && (
                                <UserInfo className="" size={"sm"} name={data.user.name} />
                            )
                        }
                        {
                            size === "compact" && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {compctViews} views •  {formatDistanceToNow(data.createdAt, { addSuffix: true })}
                                </p>
                            )
                        }
                    </a>
                   {size !== "veryCompact" && <div className="flex-none">
                        <VideoMenu data={data} onRemove={onRemove} videoId={data.id} variant="ghost" />
                    </div>}
                </div>
            </div>
        </div>
    );
}