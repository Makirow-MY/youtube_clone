"use client"
import { CategoriesSection } from "@/modules/search/ui/sections/categories-section";
import { HistorySection } from "../sections/history-section"
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { PlayListSection } from "../sections/playlist-section";


export const PlayListView = () => {
    const [isOpen, setIsOpen] = useState(false)
  
return(
      <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6 ">
        {/* <PlayListCreateModal
        open={isOpen}
        onOpenChange={setIsOpen}
        /> */}
        <div className="flex justify-between items-center">
            <div>
         <h1 className="text-3xl font-bold mb-6">PLaylist</h1>
      </div>


        </div>
         <PlayListSection />
          
        </div>
);
}
