"use client";

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { FlameIcon, HistoryIcon, HomeIcon, ListVideoIcon, PlaySquareIcon, ThumbsUpIcon, UserCircleIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import {useClerk, useAuth} from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { IoIosHome } from "react-icons/io";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
const items = [
    {
        title:  "Home",
        url: "/",
        icon:IoIosHome,
    },
    
    {
        title:  "Shorts",
        url: "/shorts",
        icon: ZapIcon ,
    },
]

export const MainSection = () => {
    const clerk = useClerk();
    const {isSignedIn} = useAuth();
const router = useRouter();
      const pathname = usePathname()
      const { state } = useSidebar();   // Get current sidebar state

  const isCollapsed = state === "collapsed";
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
                    className={`py-6 ${isCollapsed ? "p-[7em] mb-5" : ""}`}                    
                    isActive={ pathname  === item.url} // change to look on pathname
                     > 
                        <a href={item.url} className="flex items-center gap-4">
                            <item.icon style={{height: "20px", width: "20px"}}  className={`${pathname  === item.url && "fill-accent-foreground"}`} />
                            <span className={`text-md ${pathname  === item.url && "font-semibold"}`}>{item.title}</span>
                        </a>
                    </SidebarMenuButton>
                   </SidebarMenuItem>
                ))}
{
    isCollapsed && <SidebarMenuItem key={"You"}>
                    <SidebarMenuButton
                    tooltip={"You"}
                    asChild
                    key={"You"} 
                    className={`py-6 ${isCollapsed ? "p-[7em] mb-5 relative" : ""}`}                    
                    onClick={(e) => {
                        if(!isSignedIn){
                            e.preventDefault();
                          return clerk.openSignIn();
                        }
                    }} // add navigation logic here
                    > 
                        {/* <a href={"/"} className="flex items-center gap-4">
                            <UserCircleIcon style={{height: "20px", width: "20px"}} 
                            //className={`${pathname  === item.url && "fill-accent-foreground"}`} 
                            />
                        </a> */}
                         <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant={"ghost"} size={"icon"} className="flex items-center gap-4 hover:bg-secondary">
                                    <UserCircleIcon style={{height: "20px", width: "20px"}} />                           
                                  </Button>
                                </DropdownMenuTrigger>
                        
                                <DropdownMenuContent align="end" side="right" className="ml-3"  onClick={(e) => e.stopPropagation()}>
                         <DropdownMenuLabel className="text-lg font-semibold">You</DropdownMenuLabel>
                         <DropdownMenuItem
                                    onClick={() => router.push(`/user`)}
                                    className="cursor-pointer py-2"
                                  >
                                    <UserCircleIcon className="mr-2"/>
                                    My Page
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/playlist/history`)}
                                    className="cursor-pointer py-2"
                                  >
                                    <HistoryIcon className="mr-2"/>
                                    History
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/playlist/like`)}
                                    className="cursor-pointer py-2"
                                  >
                                    <ThumbsUpIcon className="mr-2" />
                                    Like Videos
                                  </DropdownMenuItem>
                                   <DropdownMenuItem
                                     onClick={() => router.push(`/playlist`)}
                                   className="cursor-pointer py-2"
                                  >
                                    <ListVideoIcon className="mr-2" />
                                    Playlist
                                  </DropdownMenuItem>
                        
                                </DropdownMenuContent>
                              </DropdownMenu>
                    </SidebarMenuButton>
                   </SidebarMenuItem>
}
                </SidebarMenu>
                
            </SidebarGroupContent>
        </SidebarGroup>    
    );
}