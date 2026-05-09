import { Suspense } from "react";
import { CategoriesSectionn } from "../sections/categories-section";
import { HomeVideosSection } from "../sections/home-videos-sections";
import { TrendingVideosSection } from "../sections/trending-videos-sections";
import { HomeShortsSection } from "../sections/home-shorts-section";
import { ShortsSection} from "../sections/shorts-section";

interface HomeViewProps {
    videoId?: string | null;
}
export const ShortView = ({videoId}: HomeViewProps) => {
  return (
    <div className="max-w-screen mx-auto mb-10 px-4 ">
            <ShortsSection videoId={videoId} />
    </div>
  );
}