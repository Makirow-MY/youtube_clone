"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Eye, Users, Heart, TrendingUp, RefreshCw, WifiOff, MessageCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

// Dummy Data (Replace with real data from your TRPC later)
const weeklyData = [
    { week: "Week 1", videos: 12, views: 2450, likes: 890 },
    { week: "Week 2", videos: 8, views: 1890, likes: 670 },
    { week: "Week 3", videos: 15, views: 3240, likes: 1240 },
    { week: "Week 4", videos: 11, views: 2780, likes: 980 },
];

const topVideos = [
    { title: "How to Build a Dashboard in Next.js", views: 12400, likes: 3420 },
    { title: "The Future of AI in 2026", views: 9800, likes: 2890 },
    { title: "Tailwind CSS Tips & Tricks", views: 7600, likes: 2150 },
    { title: "Building a YouTube Clone", views: 6500, likes: 1780 },
];

export const DashboardSection = () => {

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
                        <RefreshCw className="h-4 w-4" />
                        Retry
                    </Button>

                    <p className="text-xs text-muted-foreground mt-4">
                        If the problem continues, check your network or try again later.
                    </p>
                </div>
            )}
        >
            <Suspense fallback={<DashboardSectionSkeleton />}>

                <DashboardSectionSuspense />

            </Suspense>
        </ErrorBoundary>


    )

}

export function DashboardSectionSuspense() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    // const myUserId = window.localStorage.getItem("MyUserId")

    const query = useSuspenseInfiniteQuery(
        trpc.studio.getMany.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
            {
                getNextPageParam: (lastPage) => lastPage.nextCursor,
            }
        )
    );
    const { data: stats } = useSuspenseQuery(trpc.studio.getDashboardStats.queryOptions());
    const { data: weeklyData } = useSuspenseQuery(trpc.studio.getWeeklyAnalytics.queryOptions());
    const { data: topVideos } = useSuspenseQuery(trpc.studio.getTopVideos.queryOptions());
  const { data: recentUploads } = useSuspenseQuery(trpc.studio.getRecentUploads.queryOptions({ limit: 6 }));
  const { data: recentComments } = useSuspenseQuery(trpc.studio.getRecentComments.queryOptions({ limit: 5 }));
  const { data: recentSubscribers } = useSuspenseQuery(trpc.studio.getRecentSubscribers.queryOptions({ limit: 5 }));

    const videos = query.data;
   // console.log({ stats, weeklyData, topVideos })
    const allVideos = videos.pages.flatMap((page) => page.items);

    const compactVideos = useMemo(() => {
        return new Intl.NumberFormat("en", {
            notation: "compact",
        }).format(allVideos.length);
    }, [allVideos.length]);


    return (
        <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                        <Play className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                   <CardContent>
            <div className="text-4xl font-bold">{stats?.totalVideos || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {new Intl.NumberFormat("en", { notation: "compact" }).format(stats?.totalViews || 0)}
            </div>
          </CardContent>
        </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                        <Users className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {new Intl.NumberFormat("en", { notation: "compact" }).format(stats?.totalSubscribers || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {new Intl.NumberFormat("en", { notation: "compact" }).format(stats?.totalLikes || 0)}
            </div>
          </CardContent>
        </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Performance Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="week" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    name="Views"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="likes"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    name="Likes"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Bar Chart - Top Videos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Performing Videos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={topVideos}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="title" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="views" fill="#3b82f6" radius={6} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Uploads */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUploads?.map((video) => (
                <a href={`/videos/${video.id}`} key={video.id} className="flex gap-4 items-center hover:bg-muted p-2 rounded-lg transition-colors">
                  <div className="relative w-24 aspect-video rounded-md overflow-hidden">
                    <img src={video.thumbnailUrl || "/placeholder.jpg"} alt={video.title} className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-2">{video.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(video.createdAt), "dd MMM yyyy • HH:mm")}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{new Intl.NumberFormat("en", { notation: "compact" }).format(video.viewCount)} views</p>
                    <p className="text-emerald-600">{video.likeCount} likes</p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recent Comments */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" /> Recent Comments
              </h4>
              <div className="space-y-4 text-sm">
                {recentComments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img src={comment.user.imageUrl} className="w-8 h-8 rounded-full" alt="" />
                    <div>
                      <a href={`/users/${comment.user.clerkId}`}>
                         <p className="font-medium">{comment.user.name}</p>
                      </a>
                      <p className="text-muted-foreground line-clamp-2">{comment.content}</p>
                     <a href={`/videos/${comment.video.id}`}>
                        <p className="text-xs text-muted-foreground mt-1">
                        on "{comment.video.title}"
                      </p>
                     </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Subscribers */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" /> New Subscribers
              </h4>
              <div className="space-y-3">
                {recentSubscribers?.map((sub) => (
                  <a href={`/users/${sub.clerkId}`} key={sub.id} className="flex items-center gap-3">
                    <img src={sub.imageUrl} className="w-9 h-9 rounded-full" alt="" />
                    <div>
                      <p className="font-medium text-sm">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(sub.subscribedAt), "dd MMM")}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </>
    )
}



export const DashboardSectionSkeleton = () => {
    return (
        <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-5 w-5 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-28" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Performance Overview Chart */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-56" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-[320px] w-full bg-muted/50 rounded-xl flex items-center justify-center">
                            <Skeleton className="h-4 w-48 text-center" />
                            {/* You can enhance this with a fake chart skeleton if desired */}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Videos Bar Chart */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-52" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-[320px] w-full bg-muted/50 rounded-xl flex items-center justify-center">
                            <Skeleton className="h-4 w-52 text-center" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Uploads + Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                {/* Recent Uploads */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-5">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    {/* Thumbnail */}
                                    <Skeleton className="w-24 aspect-video rounded-md" />
                                    
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-full max-w-md" />
                                        <Skeleton className="h-4 w-40" />
                                    </div>

                                    <div className="text-right space-y-2">
                                        <Skeleton className="h-4 w-20 ml-auto" />
                                        <Skeleton className="h-4 w-16 ml-auto" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity Sidebar */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-36" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Recent Comments */}
                        <div>
                            <Skeleton className="h-5 w-40 mb-4" />
                            <div className="space-y-5">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex gap-3">
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-28" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* New Subscribers */}
                        <div>
                            <Skeleton className="h-5 w-40 mb-4" />
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Skeleton className="w-9 h-9 rounded-full" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};
