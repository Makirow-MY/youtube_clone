import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UserGetOneOutput } from "@/modules/comments/types"
import { Edit2Icon } from "lucide-react";

export const UserPageBanner = ({user, userId}: {user: any; userId: string;}) => {
    
    return(
         <div className="relative group">
               <div className={`w-full max-h-[200px] h-[15vh] md:h-[25vh] bg-linear-to-r from-blue-500 to-black-500 rounded-xl ${user.bannerUrl ? " bg-cover bg-center " : "bg-cover bg-center  bg-secondary "} `}
               style={{
                backgroundImage: user.bannerUrl ? `url(${user.bannerUrl})` :    `url(https://ui-avatars.com/api/?name=${user.name}&size=512&background=random&color=fff)`,
                 height: "200px",  
               }}
               >

                <img className="absolute top-0 right-0  z-10 h-full w-full object-cover object-center"
        src={user.bannerUrl  ? user.bannerUrl : `https://ui-avatars.com/api/?name=${user.name}&size=512&background=random&color=fff`}
        />
{
    user?.clerkId === userId && (
        <Button
        type="button"
        size={"icon"}
        className="absolute top-6 right-4 z-20 rounded-full bg-black/50 hover:bg-black/50 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <Edit2Icon className="size-4 text-white" />
        </Button>
    )
}
    <div>
        
    </div>
               </div>
    </div>
    )
}