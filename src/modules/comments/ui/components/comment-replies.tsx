import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import { CornerDownRightIcon, Loader2Icon } from "lucide-react";
import { CommentItem } from "./comments-items";
import { Button } from "@/components/ui/button";
import { useInfiniteQuery } from "@tanstack/react-query";


interface CommentRepliesProps {
    videoId: string;
    parentId: string;
}

export const CommentReplies = ({videoId, parentId}: CommentRepliesProps) => {
const trpc = useTRPC();
    const query = useInfiniteQuery(trpc.comments.getMany.infiniteQueryOptions({
            videoId,
            parentId,
            limit: DEFAULT_LIMIT
    }, {
        getNextPageParam: (lastPage) =>lastPage.nextCursor
    }));
   const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = query;
    return (
        <div className="pl-14 ">
         <div className="mt-2 flex flex-col gap-4">
           {
             isLoading && (
                <div className="flex items-center justify-center">
                    <Loader2Icon className="animate-spin size-6 text-muted-foreground" />
                </div>
             )}
              { !isLoading && data?.pages.flatMap((page) => page.items).map((comment) => (
                <CommentItem key={comment.id} comments={comment} variant="reply" />
              ))}
        </div>
        {
            hasNextPage && (
                <Button variant={"link"} size="sm" className="ml-14 text-blue-500 font-semibold" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                 <CornerDownRightIcon/>  Show more replies
                </Button>
            )
        }
        </div>
    );


}