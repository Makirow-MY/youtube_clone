"use client";

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { ChevronDownIcon, FlameIcon, HistoryIcon, HomeIcon, ListVideoIcon, PlaySquareIcon, ThumbsUpIcon, UserCircleIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import {useClerk, useAuth} from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { IoIosHome } from "react-icons/io";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/components/user-avatar";
const items = [
    {
        title:  "Home",
        url: "/",
        icon:HomeIcon,
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
   const trpc = useTRPC();
    const subscriptionsQ = useSuspenseQuery(trpc.subscription.getMany.queryOptions());
const subscriptions = subscriptionsQ.data;
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
                            <item.icon style={{height: "20px", width: "20px"}}  />
                            <span className={`text-md ${pathname  === item.url && "font-semibold"}`}>{item.title}</span>
                        </a>
                    </SidebarMenuButton>
                   </SidebarMenuItem>
                ))}

              { isCollapsed && subscriptions.length > 0 &&  <SidebarMenuItem className={`mb-5 relative`}  key={"mysubscription"}>
                                    <SidebarMenuButton
                                    tooltip={"My Subscriptions"}
                                    asChild
                                    key={"mysubscription"}
                                    className={`p-[7em] mb-5 relative`}                    
                                    onClick={(e) => {
                                        if(!isSignedIn){
                                            e.preventDefault();
                                          return clerk.openSignIn();
                                        }
                                    }} 
                                    >
                                         <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                               <Button variant={"ghost"} size={"icon"} className="flex items-center gap-4 hover:bg-secondary">
                                                    <PlaySquareIcon style={{height: "20px", width: "20px"}} />                           
                                                  </Button> 
                                                </DropdownMenuTrigger>
                                        
                                                <DropdownMenuContent align="end" side="right" className="ml-3"  onClick={(e) => e.stopPropagation()}>
                                         <DropdownMenuLabel className="text-lg font-semibold">Subscriptions</DropdownMenuLabel>
                                        
                                        { subscriptions.map((channel) => (
                                            <DropdownMenuItem>
                                              <a   href={`/user/${channel.user.clerkId}`}     className="cursor-pointer py-2 flex items-center gap-3"
                                              >
                                                      <UserAvatar
                                                            imageUrl={
                                                                channel.user.imageUrl ||
                                                                `/avatar.png`
                                                            }
                                                            name={channel.user.name}
                                                            size="sm"
                                                        />
                                                        <span className="text-sm truncate group-data-[collapsible=icon]:hidden">
                                                            {channel.user.name}
                                                        </span>
                                              </a>
                                                  </DropdownMenuItem>
                                                ))}
                                                 
                                        <DropdownMenuItem
                                                    onClick={() => router.push(`/feed/subscriptions`)}
                                                    className="cursor-pointer py-2 flex items-center gap-3"
                                                  >
                                                    <a
                                                    href="/feed/subscriptions"
                                                    className="text-blue-500 flex items-center gap-1 hover:text-blue-600 text-sm font-medium"
                                                >
                                                     <ChevronDownIcon className="size-4" />
                                                      Show more
                                                   
                                                </a>
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                    </SidebarMenuButton>
                                   </SidebarMenuItem>
                                   }

{
    isCollapsed && <SidebarMenuItem key={"You"}>
                    <SidebarMenuButton
                    tooltip={"You"}
                    asChild
                    key={"You"} 
                    className={`p-[7em] mb-5 relative`}                    
                    onClick={(e) => {
                        if(!isSignedIn){
                            e.preventDefault();
                          return clerk.openSignIn();
                        }
                    }} 
                    isActive={ pathname  === "/playlist/liked" || pathname  === "/playlist" || pathname  === "/playlist/history"} // change to look on pathname
                    
                    > 
                        <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                  
                                  variant={"ghost"} size={"icon"} className="flex items-center gap-4 hover:bg-secondary">
                                    <UserCircleIcon style={{height: "20px", width: "20px"}} />                           
                                  </Button>
                                </DropdownMenuTrigger>
                        
                                <DropdownMenuContent align="end" side="right" className="ml-3"  onClick={(e) => e.stopPropagation()}>
                         <DropdownMenuLabel className="text-lg font-semibold">You</DropdownMenuLabel>
                         <DropdownMenuItem>
                                    <a href={`/user`}  className="flex items-center cursor-pointer py-2">
                                      <UserCircleIcon className="mr-2"/>
                                    Your Profile
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <a href={`/playlist/history`}  className="flex items-center cursor-pointer py-2">
                                    <HistoryIcon className="mr-2"/>
                                    History</a>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <a href={`/playlist/liked`}  className="flex items-center cursor-pointer py-2">
                                     <ThumbsUpIcon className="mr-2" />
                                    Like Videos </a>
                                  </DropdownMenuItem>
                                   <DropdownMenuItem>
                                    <a href={`/playlist`}  className="flex items-center cursor-pointer py-2">
                                     <ListVideoIcon className="mr-2" />
                                    Playlist</a>
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