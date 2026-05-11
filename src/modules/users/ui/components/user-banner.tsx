import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UserGetOneOutput } from "@/modules/comments/types"
import { useAuth, useUser } from "@clerk/nextjs";
import { Edit2Icon } from "lucide-react";

export const UserPageBanner = ({user}: {user: any;}) => {
    const {user: myuser} =   useUser()
    const {userId} = useAuth()
   return(
         <div style={{
                backgroundImage: user[0]?.bannerUrl ? `url(${user[0]?.bannerUrl})` :    `url(https://ui-avatars.com/api/?name=${user[0]?.name}&size=512&background=random&color=fff)`,
                 height: "25vh",  
               }}
               className={`relative shadow-2xl group md:w-[90%] w-full overflow-hidden mx-20  max-h-50 h-[15vh] md:h-[25vh] bg-linear-to-r from-blue-500 to-black-500 rounded-xl ${user[0]?.bannerUrl ? " bg-cover bg-center bg-red-300" : "bg-cover bg-center  bg-secondary "}`}>
               {/* <div className={`w-full max-h-[200px] h-[15vh] md:h-[25vh] bg-linear-to-r from-blue-500 to-black-500 rounded-xl ${user[0]?.bannerUrl ? " bg-cover bg-center " : "bg-cover bg-center  bg-secondary "} `}
               style={{
                backgroundImage: user[0]?.bannerUrl ? `url(${user[0]?.bannerUrl})` :    `url(https://ui-avatars.com/api/?name=${user[0]?.name}&size=512&background=random&color=fff)`,
                 height: "25vh",  
               }}
               > */}

                <img className="absolute  top-0 right-0  z-10 h-full w-full object-cover object-center"
        src={user[0]?.bannerUrl  ? user[0]?.bannerUrl : `/banner.png`}
        />
{
    user[0]?.clerkId === myuser?.id && (
        <Button
        type="button"
        size={"icon"}
        className="absolute bottom-4 right-0 z-50 max-h-full rounded-full bg-black/50 hover:bg-black/50 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <Edit2Icon className="size-4 text-white" />
        </Button>
    )
}
                   
    </div>
    )
}