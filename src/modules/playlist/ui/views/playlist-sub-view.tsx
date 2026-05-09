import { HistorySection } from "../sections/history-section"
import { PlaylistSubSection } from "../sections/playlist-sub-section";


interface SuscriptionButtonProps{
   playListId: string;
  
}


export const PlayListSubView = ({playListId}: SuscriptionButtonProps) => {
  
return(
      <div className="max-w-screen mx-auto mb-10 px-4 pt-3.5 flex flex-col gap-y-6 ">
     
           <PlaylistSubSection playListId={playListId}   />
        </div>
);
}
