import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"
import { HomeNavbar } from "../../components/home-navbar"
import { HomeSidebar } from "../../components/home-sidebar"
import { HydrateClient, trpc, prefetch } from "@/trpc/server";
import { DEFAULT_LIMIT } from "@/constants";

interface HomeLayoutProps {
    children: React.ReactNode
}

export  async function HomeLayout({children} : HomeLayoutProps) {
    await Promise.all([
      prefetch(trpc.subscription.getMany.queryOptions()),
       ]);
  return (
    <SidebarProvider defaultOpen={true}>
        <div className="w-full ">
            <HomeNavbar />
            <div className="pt-16 min-h-screen flex relative">
              <HydrateClient>
                  <HomeSidebar/>
              </HydrateClient>
                <main className="flex-1 overflow-y-auto"> 
                    {children}
                </main>                 
            </div>            
         </div>
     
    </SidebarProvider>
  )
}

