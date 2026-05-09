import Link from "next/link";
import { VideoGetOneOutput } from "../../types"
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { SubscriptionButton } from "@/modules/subscription/ui/components/suscription-button";
import { UserInfo } from "@/modules/users/ui/components/user-info";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/modules/subscription/hooks/use-subscription";

interface VideoOwnerProps {
   user: any; // VideoGetOneOutput['user']
   video?: any; // VideoGetOneOutput
   videoId: string;
}


export const VideoOwner = ({ user, video, videoId }: VideoOwnerProps) => {
   const { userId: clerkUserId, isLoaded } = useAuth()
   const { isPending, OnClick } = useSubscription({
      userId: user.id,
      isSubscribed: user.viewerSubscribed,
      fromVideoId: videoId
   })
   return (
      <div className={` flex flex-nowrap items-center sm:items-start justify-between sm:justify-start gap-3 min-w-0`}>
         <a href={`/users/${user.id}`} >
            <div className="flex items-center gap-3 min-w-0">
               <UserAvatar size={"lg"} imageUrl={user.imageUrl} name={user.name} />
               <div className="flex flex-col gap-1 min-w-0">

                  <p className={`text-base font-medium line-clamp-1 hover:text-gray-800`}>
                     {user.name}
                  </p>

                  <span className="text-sm text-muted-foreground line-clamp-1">
                     {user.subscriberCount} subscribers
                  </span>

               </div>
            </div>
         </a>
         {
            clerkUserId === user.clerkId ? (
               <Button
                  variant={"secondary"}
                  className="rounded-full"
                  asChild
               >
                  <a href={`/studio/videos/${videoId}`}>
                     Edit Video
                  </a>
               </Button>
            ) :
               (
                  <SubscriptionButton
                     onClick={OnClick}
                     className="flex"
                     disabled={isPending || !isLoaded}
                     isSubscribed={user.viewerSubscribed}
                  />
               )
         }
      </div>
   )
}
