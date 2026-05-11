import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import {HydrateClient, prefetch, trpc } from '@/trpc/server';
import {HomeView} from "@/modules/home/ui/views/home-view"
import { DEFAULT_LIMIT } from '@/constants';
import { ShortView} from '@/modules/home/ui/views/short-view';
import { UserView } from '@/modules/users/ui/views/user-view';

 
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{
    userId: string,
    }>
}


export default async function Page({ params }: PageProps) {
  const { userId } = await params
  
await Promise.all([
  prefetch(trpc.users.getOne.queryOptions({userId: userId ?? null})),
 ]);
return (
    <HydrateClient>

      <UserView userId={userId} />
    
    </HydrateClient>
  );
}