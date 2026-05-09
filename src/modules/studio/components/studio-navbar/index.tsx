import { SidebarTrigger } from '@/components/ui/sidebar'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Authbutton } from '@/modules/auth/ui/components/auth-button'
import { StudioUploadModal } from '../studio-upload-modal'
//import StudioUploadModal from "../components/studio-upload-modal"
export  function StudioNavbar() {
    
  return (
    <nav className='fixed top-0 left-0 right-0 h-16 bg-background flex items-center px-2 pr-5 z-50 border-b shadow-md'>
     <div className="flex items-center gap-4 w-full">
        <div className='flex items-center flex-shrink-0'>
               <SidebarTrigger />
               <a href="/studio" className='flex p-4 items-center gap-2'>
                    <Image loading='lazy' src='/logo.svg' alt='logo' width={32} height={32} /> 
                    <p className='text-xl font-semibold tracking-tight'>Studio</p>
               </a>
        </div>

<div className='flex-1'/>

        <div className='flex flex-shrink-0 items-center gap-4'>
           <StudioUploadModal />
            <Authbutton /> 
        </div>

     </div>
    </nav>
  )
}
