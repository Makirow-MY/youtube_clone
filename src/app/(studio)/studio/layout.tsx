import { HomeLayout } from "@/modules/home/ui/layouts/home-layout"
import { StudioLayout } from "@/modules/studio/ui/layouts/studio-layout"

interface LayoutProps {
    children: React.ReactNode
}

function Layout({children} : LayoutProps) {
  return (
    <StudioLayout>
        {children}
    </StudioLayout>
    
  )
}

export default Layout
