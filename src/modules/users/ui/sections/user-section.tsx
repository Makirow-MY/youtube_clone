
"use client"
import { Button } from "@/components/ui/button";
import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import { useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { RefreshCwIcon, WifiOff } from "lucide-react";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { UserPageBanner } from "../components/user-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPageInfo } from "../components/user-pade-info";

interface PagePops{
    userId: string;
}

export const UserSection = ({userId}: PagePops) => {

  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 p-8 text-center border-y bg-transparent">
          <WifiOff className="h-16 w-16 text-muted-foreground/70" strokeWidth={1.5} />

          <div className="space-y-2">
            <h3 className="text-xl font-medium">You're offline</h3>
            <p className="text-muted-foreground max-w-md">
              Check your internet connection and try again.
              This page requires an active connection to load your videos.
            </p>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={resetErrorBoundary}
            className="gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" />
            Retry
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            If the problem continues, check your network or try again later.
          </p>
        </div>
      )}
    >
      <Suspense fallback={<div>
        <Skeleton className="w-full h-[200px]" />
        </div>}>

        <UserSectionSuspense userId={userId} />

      </Suspense>
    </ErrorBoundary>


  )

}

export const UserSectionSuspense = async({userId}: PagePops) => {
      const trpc = useTRPC();
      const queryClient = useQueryClient();
     // const myUserId = window.localStorage.getItem("MyUserId")
    
      const query = useSuspenseQuery(
        trpc.users.getOne.queryOptions({ userId : userId || null})
      );
const myInfo = query.data;

  const user = myInfo.user;

    return(
        <div className="flex flex-col gap-y-6">
            <UserPageBanner user={user} userId={userId} />
            <UserPageInfo user={user} />
        </div>    
    )
}