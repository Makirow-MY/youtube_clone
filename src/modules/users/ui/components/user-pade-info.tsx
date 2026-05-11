import { Button } from "@/components/ui/button"
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
               <div className="flex bg-amber-300 items-start flex-col"
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