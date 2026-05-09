import { Suspense } from "react";
import { CategoriesSectionn } from "../../home/ui/sections/categories-section";
import { VideoPageSection } from "../sections/video-section";
import { SuggestionPageSection } from "../sections/sugestion-section";
import { CommentsPageSection } from "../sections/comments-section";



interface VideoPageViewProps {
    videoId: string;
    playlistId?: string;
}


export const VideoPageView = ({videoId, playlistId}: VideoPageViewProps) => {
  return (
    <div className="max-w-[1700px] mx-auto mb-10 px-4 pt-2.5 flex flex-col">
  
  <div className="flex flex-col lg:flex-row gap-6">
     <div className="flex-1 min-w-0">
          <VideoPageSection videoId={videoId} />
          <div className="lg:hidden block mt-4">
           <SuggestionPageSection isManual={true} videoId={videoId} />
          </div>
          <CommentsPageSection videoId={videoId} />
     </div>
          <div className="hidden lg:block w-full lg:w-[350px] xl:w-[450px] shrink-1">
           <SuggestionPageSection playlistId={playlistId} videoId={videoId} />
          </div>
   </div>
       
    </div>
  );
}