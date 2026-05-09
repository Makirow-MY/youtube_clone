import { Sidebar, SidebarContent } from '@/components/ui/sidebar';
import React from 'react';
import { MainSection } from './main-section';
import { Separator } from '@/components/ui/separator';
import { PersonalSection } from './personal-section';
import { SubscriptionsSection } from './subscription-sections';

export function HomeSidebar() {
  return (
    <Sidebar
    variant='sidebar'
      collapsible="icon"        // Collapses to icons only (YouTube mini sidebar)
      className="pt-16 z-40  border-r shadow-lg" // High z-index + shadow for overlay feel
    >
      <SidebarContent className="bg-background">
        <MainSection />
        <SubscriptionsSection />
        <Separator />
        <PersonalSection />
      </SidebarContent>
    </Sidebar>
  );
}