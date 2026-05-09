"use client";

import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton } from "@/components/ui/sidebar";
import { FlameIcon, HistoryIcon, HomeIcon, ListVideoIcon, PlaySquareIcon, ThumbsUpIcon } from "lucide-react";
import Link from "next/link";
import {useClerk, useAuth} from "@clerk/nextjs";
import { usePathname } from "next/navigation";

const items = [
    {
        title:  "History",
        url: "/playlists/history",
        icon: HistoryIcon,
        auth:true,
    },
    {
        title:  "Liked Videos",
        url: "/playlists/liked",
        icon: ThumbsUpIcon,
        auth: true,
    },
    {
        title:  "All Playlists",
        url: "/playlists",
        icon: ListVideoIcon,
        auth: true,
    },

]

export const   PersonalSection = () => {
        const clerk = useClerk();
        const {isSignedIn} = useAuth();
    const pathname = usePathname()
    return (
        <SidebarGroup>
            <SidebarGroupLabel>You</SidebarGroupLabel> 
            <SidebarGroupContent>
                <SidebarMenu>

                         {items.map((item) => (
                    <SidebarMenuButton
                    tooltip={item.title}
                    asChild
                    key={item.title}
                    isActive={pathname === item.url} // change to look on pathname
                    onClick={(e) => { 
                         if(item.auth && !isSignedIn){
                            e.preventDefault();
                          return clerk.openSignIn();
                        }}} // add navigation logic here
                    > 
                        <a href={item.url} className="flex items-center gap-4">
                            <item.icon className="size-5" />
                            <span className="text-sm">{item.title}</span>
                        </a>
                    </SidebarMenuButton>
                ))}

                </SidebarMenu>
                
            </SidebarGroupContent>
        </SidebarGroup>    
    );
}