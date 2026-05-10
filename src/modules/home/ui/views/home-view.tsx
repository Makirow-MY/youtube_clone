"use client"
import { Suspense, useEffect } from "react";
import { CategoriesSectionn } from "../sections/categories-section";
import { HomeVideosSection } from "../sections/home-videos-sections";
import { HomeShortsSection } from "../sections/home-shorts-section";
import { TrendingVideosSection } from "../sections/trending-videos-sections";
import { HeartPulseIcon, User2Icon, ZapIcon } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";



interface HomeViewProps {
  categoryId?: string;
}


export const HomeView = ({ categoryId }: HomeViewProps) => {
     const clerk = useClerk();
    const {isSignedIn} = useAuth();
    
  useEffect(() => {
     if(!isSignedIn){
        clerk.openSignIn()
     }
  }, [isSignedIn])
  return (
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-4 ">
      <CategoriesSectionn categoryId={categoryId} />
   
       {/* {!categoryId &&<>
          <div className="flex items-center gap-3">
        <HeartPulseIcon className="size-5" />
                        <h2 className="text-xl font-semibold">Trending</h2>
                      </div>
       <TrendingVideosSection/></> } */}

       
      <HomeVideosSection  limit={6} categoryType="short" categoryId={categoryId} />
     
      {/*category type for you video*/}
      {
        /* {!categoryId && <>
          <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold">Trending</h2>
                      </div>
                <HomeVideosSection limit={6} categoryType="trending" categoryId={categoryId} />
                <HomeShortsSection categoryType="trending" categoryId={categoryId} />
        
           <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold">Recently Watched</h2>
                      </div>
                {/*category type trending video}
                <HomeVideosSection limit={6} categoryType="for-you" categoryId={categoryId} />
                <HomeShortsSection categoryType="for-you" categoryId={categoryId} />
        
        
        
                 
                 <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold">Latest</h2>
                      </div>
                {/*category type trending video}
                <HomeVideosSection limit={6} categoryType="for-you" categoryId={categoryId} />
                <HomeShortsSection categoryType="for-you" categoryId={categoryId} />
                {/*category type tredning short*}
         <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold">For you</h2>
                      </div>
        
                  
        </>} */
      }

      {/*category type trending video*/}
      



    </div>
  );
}