"use client";

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { FlameIcon, HomeIcon, PlaySquareIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import {useClerk, useAuth} from "@clerk/nextjs";
import { usePathname } from "next/navigation";
const items = [
    {
        title:  "Home",
        url: "/",
        icon: HomeIcon,
    },
    
    {
        title:  "Shorts",
        url: "/shorts",
        icon: ZapIcon ,
    },
   {
        title:  "Subscriptions",
        url: "/feed/subscriptions",
        icon: PlaySquareIcon,
        auth: true,
    },
]

export const MainSection = () => {
    const clerk = useClerk();
    const {isSignedIn} = useAuth();

      const pathname = usePathname()
    return (
        <SidebarGroup>
            <SidebarGroupContent>
                <SidebarMenu>

                         {items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                    tooltip={item.title}
                    asChild
                    key={item.title}                     
                    isActive={ pathname  === item.url} // change to look on pathname
                    onClick={(e) => {
                        if(item.auth && !isSignedIn){
                            e.preventDefault();
                          return clerk.openSignIn();
                        }
                    }} // add navigation logic here
                    > 
                        <a href={item.url} className="flex items-center gap-4">
                            <item.icon className="size-5" />
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