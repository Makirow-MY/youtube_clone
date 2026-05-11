"use client";

import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import React from 'react'
import Link from 'next/link'
import { LayoutDashboard, LogOutIcon, VideoIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { StudioSidebarHeader } from './studio-sidebar-header';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@clerk/nextjs';

export function StudioSidebar() {

  const pathname = usePathname()
 const {user} = useUser()

  return (
    <Sidebar className="pt-16 border-gray-500/0.3 z-40 " collapsible='icon'>
        <SidebarContent className='bg-background  '>
             <SidebarGroup>              
               <SidebarMenu>
                 <StudioSidebarHeader />
                 <Separator />
              <SidebarMenuItem>
            <SidebarMenuButton className='py-6'  isActive={pathname === "/studio"} tooltip={"My Content"} asChild>
                  <a href={"/studio"}>
                      <LayoutDashboard style={{height: "20px", width: "20px"}} />
                      <span className="text-sm">Dashboard</span>
                  </a>
            </SidebarMenuButton>
           </SidebarMenuItem>
 <SidebarMenuItem>
            <SidebarMenuButton className='py-6'  isActive={pathname === "/studio/content"} tooltip={"My Content"} asChild>
                  <a href={"/studio/content"}>
                      <VideoIcon style={{height: "20px", width: "20px"}} />
                      <span className="text-sm">Content</span>
                  </a>
            </SidebarMenuButton>
           </SidebarMenuItem>
            <SidebarMenuItem>
            <SidebarMenuButton className='py-6'  tooltip={"Exit Studio"} asChild>
                  <a href={"/"}>
                      <LogOutIcon style={{height: "20px", width: "20px"}} />
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
