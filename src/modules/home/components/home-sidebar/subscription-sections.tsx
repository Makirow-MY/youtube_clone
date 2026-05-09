// "use client";

// import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
// import { UserAvatar } from "@/components/user-avatar";
// import Link from "next/link";
// import { useAuth } from "@clerk/nextjs";

// // Dummy data for demonstration (replace with real data later)
// const dummySubscriptions = [
//   {
//     id: "1",
//     name: "Tech Insider",
//     imageUrl: "https://ui-avatars.com/api/?name=Tech+Insider&background=random&color=fff&size=128",
//     url: "/users/techinsider",
//   },
//   {
//     id: "2",
//     name: "MrBeast Gaming",
//     imageUrl: "https://ui-avatars.com/api/?name=MrBeast+Gaming&background=random&color=fff&size=128",
//     url: "/users/mrbeastgaming",
//   },
//   {
//     id: "3",
//     name: "Cooking with Sarah",
//     imageUrl: "https://ui-avatars.com/api/?name=Cooking+Sarah&background==random&color=fff&size=128",
//     url: "/users/cookingsarah",
//   },
//   {
//     id: "4",
//     name: "Space Explored",
//     imageUrl: "https://ui-avatars.com/api/?name=Space+Explored&background=3b82f6&color=fff&size=128",
//     url: "/users/spaceexplored",
//   },
//   {
//     id: "5",
//     name: "Daily Finance",
//     imageUrl: "https://ui-avatars.com/api/?name=Daily+Finance&background=10b981&color=fff&size=128",
//     url: "/users/dailyfinance",
//   },
// ];

// export function SubscriptionsSection() {
//   const { isSignedIn } = useAuth();

//   // Hide entire section if user is not signed in
//   if (!isSignedIn) return null;

//   return (
//     <SidebarGroup>
//       <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
//         Subscriptions
//       </SidebarGroupLabel>

//       <SidebarGroupContent>
//         <SidebarMenu>
//           {dummySubscriptions.map((channel) => (
//             <SidebarMenuItem key={channel.id}>
//               <SidebarMenuButton
//                 tooltip={channel.name}
//                 asChild
//                 className="hover:bg-sidebar-accent"
//               >
//                 <a href={channel.url} className="flex items-center gap-3">
//                   <UserAvatar
//                     imageUrl={channel.imageUrl}
//                     name={channel.name}
//                     size="sm"
//                   />
//                   <span className="text-sm truncate group-data-[collapsible=icon]:hidden">
//                     {channel.name}
//                   </span>
//                 </a>
//               </SidebarMenuButton>
//             </SidebarMenuItem>
//           ))}

//           {/* "Show more" link like YouTube */}
//           <SidebarMenuItem>
//             <SidebarMenuButton asChild>
//               <a href="/feed/subscriptions" className="text-blue-500 hover:text-blue-600 text-sm font-medium">
//                 Show more
//               </a>
//             </SidebarMenuButton>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarGroupContent>
//     </SidebarGroup>
//   );
// }











"use client";

import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {  useTRPC } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { DEFAULT_LIMIT } from "@/constants";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDownIcon } from "lucide-react";

export function SubscriptionsSection() {
    return (
        <Suspense
            fallback={
                Array.from({ length: 5 }).map((_, i) => (
                    <SidebarMenuItem key={i}>
                        <div className="flex items-center gap-3 px-2 py-1.5">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-28 group-data-[collapsible=icon]:hidden" />
                        </div>
                    </SidebarMenuItem>
                ))
            }
        >
            <ErrorBoundary fallback={<p>Error occured</p>}>
                <SubscriptionsSectionSuspense />
            </ErrorBoundary>
        </Suspense>
    );
}

/**
 * This component ONLY calls useAuth (always the same number of hooks).
 * The actual data-fetching happens in a child component that is only mounted when signed in.
 */
export function SubscriptionsSectionSuspense() {
    const { isSignedIn } = useAuth();

    // Early return BEFORE any data-fetching hook
    if (!isSignedIn) return null;

    // Render the signed-in component (hooks are now unconditional inside it)
    return <SignedInSubscriptionsSection />;
}

/**
 * Separate component that is ONLY rendered when the user is signed in.
 * All hooks (useSuspenseQuery) are called unconditionally here.
 */
function SignedInSubscriptionsSection() {
    const trpc = useTRPC();
    const subscriptionsQ = useSuspenseQuery(trpc.subscription.getMany.queryOptions());
const subscriptions = subscriptionsQ.data;
    return (
        <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                Subscriptions
            </SidebarGroupLabel>

            <SidebarGroupContent>
                <SidebarMenu>
                    {subscriptions.length > 0 ? (
                        subscriptions.map((channel) => (
                            <SidebarMenuItem key={channel.user.id}>
                                <SidebarMenuButton
                                    tooltip={channel.user.name}
                                    asChild
                                    className="hover:bg-sidebar-accent"
                                >
                                    <a
                                        href={`/users/${channel.user.name}`}
                                        className="flex items-center gap-3"
                                    >
                                        <UserAvatar
                                            imageUrl={
                                                channel.user.imageUrl ||
                                                `https://ui-avatars.com/api/?name=${channel.user.name}&background=64748b&color=fff`
                                            }
                                            name={channel.user.name}
                                            size="sm"
                                        />
                                        <span className="text-sm truncate group-data-[collapsible=icon]:hidden">
                                            {channel.user.name}
                                        </span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))
                    ) : (
                        <SidebarMenuItem>
                            <div className="px-3 py-2 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
                                No subscriptions yet
                            </div>
                        </SidebarMenuItem>
                    )}

                    {/* Show more link */}
                    {subscriptions.length > 0 && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <a
                                    href="/feed/subscriptions"
                                    className="text-blue-500 flex items-center gap-1 hover:text-blue-600 text-sm font-medium"
                                >
                                     <ChevronDownIcon className="size-4" />
                                      Show more
                                   
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}