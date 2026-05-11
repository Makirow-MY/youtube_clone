import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils"
import { UserGetOneOutput } from "@/modules/comments/types"
import { useSubscription } from "@/modules/subscription/hooks/use-subscription";
import { SubscriptionButton } from "@/modules/subscription/ui/components/suscription-button";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Edit2Icon } from "lucide-react";
import Link from "next/link";

export const UserPageInfo = ({user} : {user: any}) => {
    const clerk = useClerk()
    const userId = useAuth().userId
    const {isPending, OnClick} = useSubscription({
        userId: user.id,
      isSubscribed: true,
    })
    return(
         <div className="py-6">
               <div className="flex flex-col md:hidden"
               >
<div className="flex items-center gap-3">
<UserAvatar 
size={"lg"}
imageUrl={user.imageUrl}
name={user.name}
className="h-[60px] cursor-pointer w-[60px]"
onClick={() => {

    if (user.clerkId === userId) {
        clerk.openUserProfile()
    }
}}
/>
<div className="flex-1 min-w-0 ">
    <h1 className="text font-bold">{user.name}</h1>
    <div className=" flex items-center gap-1 text-xs text-muted-foreground mt-1">
        <span>3 subscribers</span>
        <span>•</span>
        <span>3 videos</span>
    </div>

</div>
</div>

{
    userId === user.clerkId ? (
        <Button
        variant={"secondary"}
        asChild
        className="w-full mt-3 rounded-full"
        >
            <Link href={"/studio"}>
              Go to Studio
            </Link>
        </Button>
    ) : (
        <SubscriptionButton size="lg"  disabled={isPending} onClick={OnClick} isSubscribed={true} />
    )
}
               </div>


    </div>
    )
}