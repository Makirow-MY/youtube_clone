import { HistorySection } from "../sections/history-section"
import { LikedSection } from "../sections/liked-section";

interface LikedViewProps{
      categoryId?: string
}
export const LikedView = ({categoryId}: LikedViewProps) => {
  
return(
      <div className="max-w-screen overflow-hidden mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6 ">
           <LikedSection  categoryId={categoryId} />
        </div>
);
}
