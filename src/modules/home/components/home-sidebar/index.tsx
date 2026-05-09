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
     className="pt-16 z-40 shadow-lg"
    >
      <SidebarContent  draggable={true} className="bg-background">
        {isLoaded ? (
          <>
            <MainSection />
           {!isCollapsed && <>
           <SubscriptionsSection />
            <Separator />
            <PersonalSection />
           </> }
          </>
        ) : (
          // Using Shadcn's built-in SidebarMenuSkeleton
          <SidebarSkeletonLoading />
        )}
      </SidebarContent>
    </Sidebar>
  );
}

// Simple reusable skeleton using official shadcn component
function SidebarSkeletonLoading() {
  return (
    <>
      {/* Main Navigation Skeleton */}
      <div className="px-2 py-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <SidebarMenuSkeleton key={i} showIcon />
        ))}
      </div>

      {/* Subscriptions Skeleton */}
      <div className="mt-4 p-2">
        <div className="px-3 mb-2">
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <SidebarMenuSkeleton key={i} showIcon />
        ))}
      </div>

      <Separator />

      {/* Personal Section Skeleton */}
      <div className="mt-4 p-2">
        <div className="px-3 mb-2">
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <SidebarMenuSkeleton key={i} showIcon />
        ))}
      </div>
    </>
  );
}