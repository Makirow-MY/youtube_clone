"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ShortsGridCard } from "../../components/shorts-grid";
import { DEFAULT_LIMIT } from "@/constants";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
interface HomeVideosSectionProps {
  categoryId?: string;
  categoryType: string;
}
export const HomeShortsSection = ({ categoryId, categoryType }: HomeVideosSectionProps) => {
  return (

    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <div className="min-h-[200px] flex items-center justify-center">
          <Button onClick={resetErrorBoundary} variant="outline">
            Retry loading Shorts
          </Button>
        </div>
      )}
    >
      <Suspense fallback={<ShortsSkeleton />}>
        <HomeShortsSectionSuspense categoryId={categoryId} categoryType={categoryType} />
      </Suspense>

    </ErrorBoundary>

  );
};

export const ShortsSkeleton = () => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-4">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-6 w-6 rounded-full" />
    </div>
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-44">
          <Skeleton className="aspect-[9/16] w-full rounded-xl" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const HomeShortsSectionSuspense = ({ categoryId, categoryType }: HomeVideosSectionProps) => {
  const trpc = useTRPC();

  const videosQuery = useSuspenseInfiniteQuery(
    trpc.videos.getMany.infiniteQueryOptions(
      {
        limit: DEFAULT_LIMIT,
        categoryId: categoryId,
        
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor, enabled: true
      }
    )
  );

  const shorts = videosQuery.data.pages.flatMap((p) => p.items);

  if (shorts.length === 0) return null;

  return (
    <div>
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide">
        {shorts.map((short) => (
          <div key={short.id} className="flex-shrink-0 w-44">
            <ShortsGridCard data={short} />
          </div>
        ))}
      </div>
    </div>
  );
};