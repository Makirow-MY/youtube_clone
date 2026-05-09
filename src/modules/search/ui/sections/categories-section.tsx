"use client"
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import { FilterCarousel } from "@/components/filter-carousel"
import { useRouter } from 'next/navigation';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';

interface CategoriesSectionProps {
  categoryId?: string;
  limit?: number;
}



export const CategoriesSection = ({ categoryId, limit }: CategoriesSectionProps) => {
  return (
    <Suspense fallback={<FilterCarousel isLoading={true} onSelect={() => { }} data={[]} />} >
      <ErrorBoundary fallback={<div>Something went wrong...</div>}>
        <CategoriesSectionSuspense categoryId={categoryId} limit={limit}   />
      </ErrorBoundary>
    </Suspense>
  );
}

const CategoriesSectionSuspense = ({ categoryId, limit }: CategoriesSectionProps) => {
  const trpc = useTRPC();
  const router = useRouter();
  const categories = useSuspenseQuery(trpc.categories.getMany.queryOptions({
    categoryId: categoryId,
  }));

  const data = categories.data.sort(() => Math.random() - 0.5).slice(0, limit).map((cat) => ({
    value: cat.id,
    label: cat.topicName,
  }))



  const onSelect = (value: string | null) => {
    //  console.log("Selected category:", value);
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set("categoryId", value);
    } else {
      url.searchParams.delete("categoryId");
    }
    router.push(url.toString());
  }


  return <FilterCarousel onSelect={onSelect} value={categoryId} data={data} />;
}