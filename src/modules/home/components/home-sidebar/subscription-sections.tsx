"use client";

import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import {  useTRPC } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { DEFAULT_LIMIT } from "@/constants";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDownIcon, PlaySquareIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function SubscriptionsSection() {
    return (
        <Suspense
            fallback={
                Array.from({ length: 5 }).map((_, i) => (
                    <SidebarMenuItem key={i}>
                        <div className="flex items-center gap-3 px-2 py-1.5">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-28 group-data-[collapsible=icon]:hidden" />
                        </div>
                    </SidebarMenuItem>
                ))
            }
        >
            <ErrorBoundary fallback={<p>Error occured</p>}>
                <SubscriptionsSectionSuspense />
            </ErrorBoundary>
        </Suspense>
    );
}


export function SubscriptionsSectionSuspense() {
    const { isSignedIn } = useAuth();

    // Early return BEFORE any data-fetching hook
    if (!isSignedIn) return null;

    // Render the signed-in component (hooks are now unconditional inside it)
    return <SignedInSubscriptionsSection />;
}

const items = [
   {
        title:  "Subscriptions",
        url: "/feed/subscriptions",
        icon: PlaySquareIcon,
        auth: true,
    },
]

function SignedInSubscriptionsSection() {
    const trpc = useTRPC();
    const subscriptionsQ = useSuspenseQuery(trpc.subscription.getMany.queryOptions());
const subscriptions = subscriptionsQ.data;
const router = useRouter();
 const clerk = useClerk();
    const {isSignedIn} = useAuth();

      const pathname = usePathname()
      const { state } = useSidebar();   // Get current sidebar state

  const isCollapsed = state === "collapsed";
  if(subscriptions.length === 0) return null
    return (
        <SidebarGroup>
             <SidebarGroupContent>
                <SidebarMenu>
                             {!isCollapsed && items.map((item) => (
                                              <SidebarMenuItem key={item.title}>
                                      <SidebarMenuButton
                                      tooltip={item.title}
                                      asChild
                                      key={item.title} 
                                      className={`py-6 ${isCollapsed ? "p-[7em] mb-5" : ""}`}                    
                                      isActive={ pathname  === item.url} // change to look on pathname
                                      onClick={(e) => {
                                          if(item.auth && !isSignedIn){
                                              e.preventDefault();
                                            return clerk.openSignIn();
                                          }
                                      }} // add navigation logic here
                                      > 
                                          <a href={item.url} className="flex items-center gap-4">
                                              <item.icon style={{height: "20px", width: "20px"}}  className={`${pathname  === item.url && "fill-accent-foreground"}`} />
                                              <span className={`text-md ${pathname  === item.url && "font-semibold"}`}>{item.title}</span>
                                          </a>
                                      </SidebarMenuButton>
                                     </SidebarMenuItem>
                                  ))}
                                  
                                  { isCollapsed && <SidebarMenuItem key={items[0].title}>
                    <SidebarMenuButton
                    tooltip={items[0].title}
                    asChild
                    key={items[0].title}
                    className={`py-6 ${isCollapsed ? "p-[7em] mb-5 relative" : ""}`}                    
                    onClick={(e) => {
                        if(!isSignedIn){
                            e.preventDefault();
                          return clerk.openSignIn();
                        }
                    }} // add navigation logic here
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
                            <DropdownMenuItem
                                    onClick={() => router.push(`/users/${channel.user.name}`)}
                                    className="cursor-pointer py-2 flex items-center gap-3"
                                  >
                                    <UserAvatar
                                            imageUrl={
                                                channel.user.imageUrl ||
                                                `https://ui-avatars.com/api/?name=${channel.user.name}&background=random&color=fff`
                                            }
                                            name={channel.user.name}
                                            size="sm"
                                        />
                                        <span className="text-sm truncate group-data-[collapsible=icon]:hidden">
                                            {channel.user.name}
                                        </span>
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
                    {!isCollapsed && (
                        subscriptions.map((channel) => (
                            <SidebarMenuItem key={channel.user.id}>
                                <SidebarMenuButton
                                
                                    tooltip={channel.user.name}
                                    asChild
                                    className="py-6 hover:bg-sidebar-accent"
                                >
                                    <a
                                        href={`/users/${channel.user.name}`}
                                        className="flex items-center gap-3"
                                    >
                                        <UserAvatar
                                            imageUrl={
                                                channel.user.imageUrl ||
                                                `https://ui-avatars.com/api/?name=${channel.user.name}&background=64748b&color=fff`
                                            }
                                            name={channel.user.name}
                                            size="sm"
                                        />
                                        <span className="text-sm truncate group-data-[collapsible=icon]:hidden">
                                            {channel.user.name}
                                        </span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))
                    ) }

                    {/* Show more link */}
                    {!isCollapsed && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <a
                                    href="/feed/subscriptions"
                                    className="text-blue-500 flex items-center gap-1 hover:text-blue-600 text-sm font-medium"
                                >
                                     <ChevronDownIcon className="size-4" />
                                      Show more
                                   
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}