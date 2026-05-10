"use client"
import { useTRPC } from '@/trpc/client';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import { FilterCarousel } from "@/components/filter-carousel"
import { useRouter } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';

interface CategoriesSectionProps {
  categoryId?: string;
}



export const CategoriesSectionn = ({ categoryId }: CategoriesSectionProps) => {
  return (

    <ErrorBoundary fallback={<div>Something went wrong...</div>}>
      <Suspense fallback={<FilterCarousel isLoading={true} onSelect={() => { }} data={[]} />} >
        <CategoriesSectionSuspense categoryId={categoryId} />
      </Suspense>

    </ErrorBoundary>

  );
}

const CategoriesSectionSuspense = ({ categoryId }: CategoriesSectionProps) => {
  const router = useRouter();
 const trpc = useTRPC();
  
const categories = useSuspenseQuery(
   trpc.categories.getMany.queryOptions({
    categoryId: categoryId,
   })
  );

  const data = categories.data.map((cat) => ({
    value: cat.id,
    label: cat.topicName,
  }))


  const onSelect = (value: string | null) => {
   // console.log("Selected category:", value);
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set("categoryId", value);
    } else {
      url.searchParams.delete("categoryId");
    }
    router.push(url.toString());
  }


  return <FilterCarousel onSelect={onSelect} value={categoryId} data={data || []} />;
}