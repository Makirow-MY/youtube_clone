import { Suspense } from "react";
import { CategoriesSectionn } from "../sections/categories-section";
import { HomeVideosSection } from "../sections/home-videos-sections";
import { TrendingVideosSection } from "../sections/trending-videos-sections";
import { SubscriptionsVideosSection } from "../sections/subscriptions-sections";

export const SubscriptionView = () => {
  return (
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6 ">
      <div>
        <h1 className="text-2xl  font-bold">My Subscriptions</h1>

        <p className="text-xs text-muted-foreground mt-1">Videos from your favorite creators</p>
      </div>
       <SubscriptionsVideosSection />
    </div>
  );
}