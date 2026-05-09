"use client";

import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import React from 'react'
import Link from 'next/link'
import { LogOutIcon, VideoIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { StudioSidebarHeader } from './studio-sidebar-header';
import { Separator } from '@/components/ui/separator';

export function StudioSidebar() {

  const pathname = usePathname()


  return (
    <Sidebar className="pt-16 border-gray-500/0.3 z-40 " collapsible='icon'>
        <SidebarContent className='bg-background  '>
             <SidebarGroup>              
               <SidebarMenu>
                 <StudioSidebarHeader />
                 <Separator />
              <SidebarMenuItem>
            <SidebarMenuButton isActive={pathname === "/studio"} tooltip={"My Content"} asChild>
                  <a href={"/studio"}>
                      <VideoIcon className="size-5" />
                      <span className="text-sm">Content</span>
                  </a>
            </SidebarMenuButton>
           </SidebarMenuItem>

            <SidebarMenuItem>
            <SidebarMenuButton tooltip={"Exit Studio"} asChild>
                  <a href={"/"}>
                      <LogOutIcon className="size-5" />
                      <span>Exit Studio </span>
                  </a>
            </SidebarMenuButton>
           </SidebarMenuItem>

           </SidebarMenu>

           </SidebarGroup>
          
           
        </SidebarContent>
    </Sidebar>
  )
}
