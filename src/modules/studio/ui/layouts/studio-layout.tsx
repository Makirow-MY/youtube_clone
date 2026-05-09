import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"
import { StudioNavbar } from "../../components/studio-navbar"
import { StudioSidebar } from "../../components/studio-sidebar"

interface StudioLayoutProps {
    children: React.ReactNode
}

export function StudioLayout({children} : StudioLayoutProps) {
  return (
    <SidebarProvider>
        <div className="w-full ">
            <StudioNavbar />
            <div className="pt-16 min-h-screen flex">
               <StudioSidebar/>
                <main className="flex-1 overflow-y-auto"> 
                    {children}
                </main>                 
            </div>            
         </div>
     
    </SidebarProvider>
  )
}

