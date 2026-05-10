"use client";

import { Sidebar, SidebarContent, useSidebar } from '@/components/ui/sidebar';
import React, { useEffect, useState } from 'react';
import { MainSection } from './main-section';
import { Separator } from '@/components/ui/separator';
import { PersonalSection } from './personal-section';
import { SubscriptionsSection } from './subscription-sections';
import { SidebarMenuSkeleton } from '@/components/ui/sidebar'; // Import from shadcn

export function HomeSidebar() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // You can replace this with real data loading logic later
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 700);

    return () => clearTimeout(timer);
  }, []);
      const { state } = useSidebar();   // Get current sidebar state

  const isCollapsed = state === "collapsed";
  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="bg-background max-h-[100vh] overflow-y-auto pt-16 z-40 shadow-lg"
    >
      <SidebarContent className="bg-background" draggable={true} >
            <MainSection />
           {!isCollapsed && <>
            <Separator />
           <SubscriptionsSection />
            <Separator />
            <PersonalSection />
           </> }
          </SidebarContent>
    </Sidebar>
  );
}
