import { SidebarTrigger } from '@/components/ui/sidebar'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { SearchInput } from './searchInput'
import { Authbutton } from '@/modules/auth/ui/components/auth-button'
import { Button } from '@/components/ui/button'
import { MoonIcon } from 'lucide-react'
import { FaBell } from 'react-icons/fa6'
import { IoMdNotifications } from 'react-icons/io'

export  function HomeNavbar() {
    
  return (
    <nav className='fixed top-0 left-0 right-0 h-16 bg-background shadow flex items-center px-2 pr-5 z-50'>
     <div className="flex items-center gap-4 w-full">
        <div className='flex items-center flex-shrink-0'>
               <SidebarTrigger />
               <a href="/" className='flex p-4 items-center gap-2'>
                    <Image src='/logo.svg' alt='logo' width={32} height={32} /> 
                    <p className='text-xl font-semibold tracking-tight'>GodTube</p>
               </a>
        </div>

        <div className='flex-1 flex justify-center max-w-[720px] mx-auto'>
              <SearchInput />
        </div>

        <div className='flex flex-shrink-0 items-center gap-4'>
          <Button className='rounded-full' variant={"outline"} size={"icon"}>
               <MoonIcon className='size-5 ' />
          </Button>
          <Button className='rounded-full' variant={"outline"} size={"icon"}>
               <IoMdNotifications className='size-5 ' />
          </Button>
            <Authbutton /> 
        </div>

     </div>
    </nav>
  )
}
