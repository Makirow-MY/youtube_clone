import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils"
import { UserGetOneOutput } from "@/modules/comments/types"
import { useSubscription } from "@/modules/subscription/hooks/use-subscription";
import { SubscriptionButton } from "@/modules/subscription/ui/components/suscription-button";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Edit2Icon } from "lucide-react";
import Link from "next/link";

export const UserPageInfo = ({user} : {user: UserGetOneOutput["user"]}) => {
    const clerk = useClerk()
    const isMobile = useIsMobile()
    const userId = useAuth().userId
    const {isPending, OnClick} = useSubscription({
        userId: user[0].id,
      isSubscribed: user[0].viewerSubscribed,
    })
    return(
         <div className={isMobile ? "p-0  w-full ": "p-12 w-[80%] "}>
               <div className="flex items-start flex-col"
               >
<div className="flex items-center gap-3">
<UserAvatar 
size={isMobile ? 'lg' : "xl"}
imageUrl={user[0].imageUrl}
name={user[0].name}
className="cursor-pointer"
onClick={() => {

    if (user[0].clerkId === userId) {
        clerk.openUserProfile()
    }
}}
/>
<div className="flex-1 min-w-0 ">
    <h1 className={isMobile ? "text-sm font-bold line-clamp-1": "line-clamp-1 text-2xl font-bold"}>{user[0].name}</h1>
    <div className=" flex items-center gap-1 text-xs text-muted-foreground mt-1">
        <span>{user[0].subscriberCount} subscribers</span>
        <span>•</span>
        <span>{user[0].videoCount} videos</span>
    </div>
<p  className=" text-xs text-muted-foreground mt-2">{"This is my channel page"}</p>
{
   !isMobile ? userId === user[0].clerkId ? (
        <Button
        variant={"default"}
        asChild
        className="px-4 py-6 mt-3 rounded-full"
        >
            <a href={"/studio"}>
              Visit Studio
            </a>
        </Button>
    ) : (
        <SubscriptionButton size="lg" className="px-4 py-6  mt-3"  disabled={isPending} onClick={OnClick} isSubscribed={user[0].viewerSubscribed} />
    ) : null
}
</div>

</div>
{
   isMobile ? userId === user[0].clerkId ? (
        <Button
        variant={"default"}
        asChild
        className="px-2 py-3 w-full mt-3 rounded-full"
        >
            <a href={"/studio"}>
              Visit Studio
            </a>
        </Button>
    ) : (
        <SubscriptionButton size="lg" className="px-2 py-3  w-full  mt-3"  disabled={isPending} onClick={OnClick} isSubscribed={user[0].viewerSubscribed} />
    )
    : null
}
               </div>


    </div>
    )
}





export const UserPageInfoSkeleton = () => {
    const isMobile = useIsMobile();

    return (
        <div className={isMobile ? "p-0 w-full" : "p-12 w-[80%]"}>
            <div className="flex items-start flex-col">
                {/* Avatar + Info Row */}
                <div className="flex items-center gap-3">
                    {/* Avatar Skeleton */}
                    <UserAvatar 
                        size={isMobile ? 'lg' : "xl"}
                        imageUrl={""}
                        name=""
                        className="opacity-50"
                    />

                    {/* Info Section */}
                    <div className="flex-1 min-w-0 space-y-3">
                        {/* Name */}
                        <Skeleton className={isMobile ? "h-5 w-48" : "h-8 w-80"} />

                        {/* Stats */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-28" />
                            <span className="text-muted-foreground">•</span>
                            <Skeleton className="h-4 w-24" />
                        </div>

                        {/* Description */}
                        <Skeleton className="h-4 w-[70%] mt-1" />

                        {/* Desktop Button */}
                        {!isMobile && (
                            <div className="pt-2">
                                <Skeleton className="h-12 w-44 rounded-full" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Button */}
                {isMobile && (
                    <Skeleton className="h-12 w-full mt-4 rounded-full" />
                )}
            </div>
        </div>
    );
};