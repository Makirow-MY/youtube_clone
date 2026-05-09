import { HomeLayout } from "@/modules/home/ui/layouts/home-layout"
import { TRPCReactProvider  } from "@/trpc/client"
export const dynamic = "force-dynamic"

interface LayoutProps {
    children: React.ReactNode
}

function Layout({children} : LayoutProps) {
  return (
     <TRPCReactProvider >
            <HomeLayout>
        {children}
    </HomeLayout>
    </TRPCReactProvider>
    
    
  )
}

export default Layout
