
"use client"

import React, { useEffect } from 'react'
import { FormSection } from '../sections/form-section';
import { toast } from 'sonner';

interface PagePops{
    videoId: string;
}

export  function VideoView({videoId}:PagePops) {
  useEffect(() => {
     toast.dismiss()
  },[])
  return (
    <div className='px-4 pt-2.5 max-w-screen-lg '>
         <FormSection videoId={videoId} />
    </div>
  )
}
