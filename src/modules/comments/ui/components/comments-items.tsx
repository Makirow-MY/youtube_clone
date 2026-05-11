import Link from "next/link";
import { VideoGetManyOutput } from "../../types";
import { UserAvatar } from "@/components/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, ChevronUpIcon, MessagesSquareIcon, MoreHorizontalIcon, MoreVerticalIcon, ReplyIcon, ThumbsDownIcon, ThumbsUpIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CommentForm } from "./comment-form";
import { CommentReplies } from "./comment-replies";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_LIMIT } from "@/constants";

interface CommentsItemsProps {
     comments: VideoGetManyOutput["items"][number];
     variant?: "comment" | "reply"

}

export const CommentItem = ({comments, variant = "comment"}: CommentsItemsProps) => {
 const {userId: clerkUserId, isLoaded} = useAuth()
  const trpc = useTRPC();
   const clerk = useClerk();
const queryClient = useQueryClient();
 const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);
  const [isRemove, setIsRemoved] = useState(null);
 const remove = useMutation(
     trpc.comments.remove.mutationOptions({
       onSuccess: () => {
           queryClient.invalidateQueries({
           queryKey: trpc.comments.getOne.queryKey({ commentId: comments.id}),
         });
          queryClient.invalidateQueries({
           queryKey: trpc.comments.getMany.queryKey({videoId: comments.videoId, parentId: comments.parentId}),
         });
                queryClient.refetchQueries({
           queryKey: trpc.comments.getMany.queryKey({videoId: comments.videoId}),
         });
         
         
         toast.success("Comment deleted successfully")
       
       },
        onError(error) {
        if(error.data?.code === "UNAUTHORIZED") {
            toast.error("You must sign in to delete this comment.") 
            clerk.openSignIn()
        }
          else{
            toast.error("An error occurred while deleting the comment. Please try again.")
                    }
    
     }
     })
   ); 
 

    const like  = useMutation(
     trpc.commentReactions.like.mutationOptions({
       onSuccess: () => {
          queryClient.invalidateQueries({
           queryKey: trpc.comments.getOne.queryKey({commentId: comments.id}),
         });
          queryClient.invalidateQueries({
           queryKey: trpc.comments.getMany.queryKey(),
         });
       toast.success("Comment liked successfully")
       },
        onError(error) {
          if(error.data?.code === "UNAUTHORIZED") {
            clerk.openSignIn()
            toast.error("You must sign in to like this video.")
          }
          else{
            toast.error("An error occurred while processing your reaction. Please try again.")
          }
         }
     })
   ); 
   
    
       const dislike  = useMutation(
     trpc.commentReactions.dislike.mutationOptions({
       onSuccess: () => {
          queryClient.invalidateQueries({
           queryKey: trpc.comments.getOne.queryKey({commentId: comments.id}),
         });
          queryClient.invalidateQueries({
           queryKey: trpc.comments.getMany.queryKey(),
         });
          toast.success("Comment disliked successfully")
       
       },
        onError(error) {
          if(error.data?.code === "UNAUTHORIZED") {
            clerk.openSignIn()
            toast.error("You must sign in to dislike this video.")
          }
            else{
            toast.error("An error occurred while processing your reaction. Please try again.")            
            }
         }
     })
   );
    return (
        <div>
            <div className="flex gap-4">
           <a href={`/user/${comments.user.clerkId}`}>
           <UserAvatar
           size={variant === "comment" ? "lg" : "sm"}
           imageUrl={comments.user?.imageUrl || `/avatar.png`}
           name={comments.user.name}
           /></a>
           <div className="flex-1 min-w-0">

            <a href={`/user/${comments.user.clerkId}`}>
            <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm pb-0.5">
                    {comments.user.clerkId === clerkUserId ? `${comments.user.name.split(' ')[0]} ${comments.user.name.split(' ')[1]}... (You)` : comments.user.name}
                </span>
                <span className="text-muted-foreground text-xs ">
                    {formatDistanceToNow(comments.createdAt, {addSuffix: true})}
                </span>
            </div>
            </a>
            <p className="text-sm">{comments.content}</p>
            <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center  cursor-pointer">
                        <Button variant={"ghost"} 
                         onClick={() => like.mutate({commentId: comments.id})}
                         disabled={like.isPending || dislike.isPending}
                        size="icon" className={"size-8"}>
                            <ThumbsUpIcon className={cn("size-4",
                                        comments.viewerReaction === "like" && "fill-black"
                                    )} />
                        </Button>
                              <span className="text-xs text-muted-foreground">{comments.likeCount}</span>   
                         <Button variant={"ghost"} 
                         onClick={() => {dislike.mutate({commentId: comments.id})}}
                         disabled={like.isPending || dislike.isPending}
                         size="icon" className={"size-8"}>
                            <ThumbsDownIcon className={cn("size-4",
                                        comments.viewerReaction === "dislike" && "fill-black"
                                    )} />
                        </Button>

                         <span className="text-xs text-muted-foreground">{comments.dislikeCount}</span> 
                       
                            </div> 

                            {
                                variant === "comment" && (
                                    <Button variant={"ghost"} size="icon" className={"h-8"} disabled={false} onClick={() => {
                                setIsReplyOpen(true)
                            }}>
                                        Reply
                                    </Button>
                                )
                                }
            </div>
            </div>

            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>

                    <Button variant={"ghost"} className="size-8" size="icon" disabled={!isLoaded || clerkUserId !== comments.user.clerkId}>
                      <MoreVerticalIcon />
                    </Button>

                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {
                       variant === "comment" && (
                            <DropdownMenuItem onClick={() => {
                                setIsReplyOpen(true)
                            }}>
                                <MessagesSquareIcon className="size-4" />
                                Reply
                            </DropdownMenuItem>
                        )
                    }

                    {comments.user.clerkId === clerkUserId && <DropdownMenuItem onClick={() => remove.mutate({ commentId: comments.id })}>
                       <Trash2Icon className="size-4" />
                        Delete
                    </DropdownMenuItem>}
                </DropdownMenuContent>

            </DropdownMenu>
        </div>

        {
    isReplyOpen && variant === "comment" && (
                <div className="pl-14 mt-4">
                    <CommentForm
                        videoId={comments.videoId}
                        variant="reply" 
                        parentId={comments.id}
                        onCancel={() => {
                            setIsReplyOpen(false)
                        }}
                        onSuccess={() => {
                            setIsReplyOpen(false);
                            setIsRepliesOpen(true);
                        }}
                    />
                </div>
            )

        }

        {
            comments.replyCount > 0 && variant === "comment" && (
                <Button variant={"link"} size="sm" className="ml-14 text-blue-500 font-semibold" onClick={() => setIsRepliesOpen(prev => !prev)}>
                    {isRepliesOpen ? <><ChevronUpIcon />  Hide Replies </> : <><ChevronDownIcon  />  View Replies ({comments.replyCount}) </> }
                </Button>
            )
        }
        {
           comments.replyCount > 0 && variant === "comment" && isRepliesOpen && (
                <div className="pl-14 mt-4">
                    <CommentReplies videoId={comments.videoId} parentId={comments.id} />
                </div>
                )
        }
        </div>
    );

}