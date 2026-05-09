"use client";

import { SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { FlameIcon, HomeIcon, PlaySquareIcon } from "lucide-react";
import Link from "next/link";
import {useUser} from "@clerk/nextjs";
import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonalSection } from "./personal-section";


export const StudioSidebarHeader = () => {
     
const {user} = useUser();
const {state} = useSidebar();
    // console.log("my user", user)

     if(!user) return(
        <SidebarHeader className="flex justify-center items-center pb-4" >
               <Skeleton className="size-[112px] rounded-full" />
                <div className="flex flex-col items-center gap-y-2 mt-2">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton  className="h-4 w-[100px]"/>
                </div>
        </SidebarHeader>
     )

     if (state === "collapsed") {
       return (
         <SidebarMenuItem>
                   <SidebarMenuButton    tooltip={"Your Profile"} asChild>
                         <a href={"/users/current"} >
                          <UserAvatar imageUrl={`${user?.imageUrl}`} name={user?.fullName || user?.username || "User"    } 
                         size={"xs"}
                          />
                          <span className="text-sm">Your Profile</span>
                        </a>
                   </SidebarMenuButton>
       </SidebarMenuItem>
       )  
     }

    return (
       
                    <SidebarHeader className="flex justify-center items-center pb-4">
                        <a href={"/users/current"} >
                          <UserAvatar imageUrl={`${user?.imageUrl}`} name={user?.fullName || user?.username || "User"    } 
                          className="size-[112px] object-cover hover:opacity-80 transition-opacity"
                          />
                        </a>
                        <div className="flex flex-col items-center ggap-y-2 mt-2">
                            <p className="text-xs font-medium">Your Profile</p>
                            <p className="text-sm capitalize font-bold text-muted-foreground">{user?.fullName}</p>
                        </div>
                    </SidebarHeader>
             

    );
}