"use client";

import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { FlameIcon, HistoryIcon, HomeIcon, ListVideoIcon, PlaySquareIcon, ThumbsUpIcon } from "lucide-react";
import Link from "next/link";
import {useClerk, useAuth} from "@clerk/nextjs";

const items = [
    {
        title:  "History",
        url: "/playlist/history",
        icon: HistoryIcon,
        auth:true,
    },
    {
        title:  "Liked Videos",
        url: "/playlist/liked",
        icon: ThumbsUpIcon,
        auth: true,
    },
    {
        title:  "All Playlists",
        url: "/playlist",
        icon: ListVideoIcon,
        auth: true,
    },

]

export const   PersonalSection = () => {
        const clerk = useClerk();
        const {isSignedIn} = useAuth();
      const { state } = useSidebar();   // Get current sidebar state

  const isCollapsed = state === "collapsed";
    return (
        <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
  You
</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>

                         {items.map((item) => (
                             <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                    tooltip={item.title}
                    asChild
                    className="py-6"  
                    key={item.title}
                    isActive={false} // change to look on pathname
                    onClick={(e) => { 
                         if(item.auth && !isSignedIn){
                            e.preventDefault();
                          return clerk.openSignIn();
                        }}} // add navigation logic here
                    > 
                        <a href={item.url} className="flex items-center gap-4">
                            <item.icon style={{height: "20px", width: "20px"}} className="size-5" />
                            <span className="text-sm">{item.title}</span>
                        </a>
                    </SidebarMenuButton>
                    </SidebarMenuItem>

                ))}

                </SidebarMenu>
                
            </SidebarGroupContent>
        </SidebarGroup>    
    );
}