// app/studio/videos/[videoId]/form-section.tsx - Updated UI
"use client"

import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTRPC } from '@/trpc/client';
import { 
    CopyIcon, 
    Globe2Icon, 
    ImagePlusIcon, 
    Loader2Icon, 
    LockIcon, 
    MoreVerticalIcon, 
    RefreshCwIcon, 
    RotateCcwIcon, 
    SparklesIcon, 
    TagIcon, 
    TrashIcon, 
    Wand2Icon,
    TrendingUpIcon,
    UsersIcon,
    HashIcon,
    XIcon,
    CheckCheckIcon
} from 'lucide-react';
import React, { Suspense, useState, useEffect } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { ErrorBoundary } from 'react-error-boundary';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { VideoPlayer } from '@/modules/videos/ui/components/video-player';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { THUMBNAIL_FALLBACK } from '@/modules/videos/constants';
import { ThumbnailUploadModal } from '../../components/thumbnail-upload';
import { APP_URL, DEFAULT_LIMIT } from '@/constants';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { videoUpdateSchema } from '@/db/schema';
import { SnakeCaseTitle } from '@/lib/utils';

interface FormProps {
    videoId: string;
}

export function FormSection({ videoId }: FormProps) {
    return (
       
            <ErrorBoundary fallbackRender={({ resetErrorBoundary }) => (
                <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 p-8 text-center border-y bg-transparent">
                    <Button onClick={resetErrorBoundary} variant="outline" className="gap-2">
                        <RefreshCwIcon className="h-4 w-4" />
                        Retry
                    </Button>
                </div>
            )}>
         <Suspense fallback={<FormSectionSkeleton />}>   
              <FormSectionSuspense videoId={videoId} />
        </Suspense>
            </ErrorBoundary>
        
    )
}


export function FormSectionSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header area - title + actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />           {/* "Video Details" title */}
          <Skeleton className="h-4 w-48" />           {/* subtitle */}
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-24 rounded-md" />   {/* Save button */}
          <Skeleton className="h-10 w-10 rounded-md" />   {/* More menu icon */}
        </div>
      </div>

      {/* Main grid layout - same as real component */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column - form fields */}
        <div className="space-y-10 lg:col-span-3">
          {/* Title field */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />           {/* Label */}
            <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-56 w-full rounded-md" /> {/* Tall textarea */}
          </div>

            <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="rounded-md relative h-[84px]
                w-[153px] group" /> {/* Tall textarea */}
          </div>

          


          {/* Category select */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>

        {/* Right column - video preview + metadata */}
        <div className="lg:col-span-2 space-y-8">
          {/* Video player area + card */}
          <div className="rounded-xl overflow-hidden border bg-transparent">
            {/* Video preview */}
            <Skeleton className="aspect-video w-full rounded-t-xl" />

            {/* Metadata blocks inside card */}
            <div className="p-5 space-y-6">
              {/* Video link block */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />           {/* "Video link" label */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-8 w-8 rounded-md" /> {/* Copy icon */}
                </div>
              </div>

              {/* Video Status */}
              <div className="flex justify-between items-center">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>

              {/* Subtitles Status */}
              <div className="flex justify-between items-center">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-40" />
                </div>
              </div>
            </div>
          </div>

          {/* Visibility field (below the card in your layout) */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormSectionSuspense({ videoId }: FormProps) {
    const router = useRouter()
    const [modalOpen, setModalOpen] = useState(false)
    const [showAITags, setShowAITags] = useState(false)
    const [suggestedTags, setSuggestedTags] = useState<string[]>([])
     const [suggestedCat, setSuggestedCat] = useState<string[]>([])
    const trpc = useTRPC();
    const queryClient = useQueryClient();
   
    const videoQuery = useSuspenseQuery(
        trpc.studio.getOne.queryOptions({ id: videoId})
    );
    const video = videoQuery.data;

    const categoriesQuery = useSuspenseQuery(
        trpc.categories.getMany.queryOptions({
        categoryId: null,
   })
    );
    const categories = categoriesQuery.data;

    useEffect(() => {
       if(categories.length > 0 && suggestedTags.length === 0){
        const TagName = categories.map(t => t.topicName)
        setSuggestedTags(TagName)
       }
    }, [categories])

    // Get AI-generated tags
    // const aiTagsQuery = useSuspenseQuery(
    //     trpc.videos.getAITags.queryOptions({ videoId })
    // );

    const update = useMutation(
        trpc.videos.update.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: trpc.studio.getOne.queryKey({ id: videoId }),
                });
                queryClient.invalidateQueries({
                    queryKey: trpc.studio.getMany.queryKey({ limit: DEFAULT_LIMIT }),
                });
                toast.success("Video updated successfully")
            },
            onError: () => {
                toast.error("Failed to save video. Please try again.")
            },
        })
    );

    const autoTagMutation = useMutation(
        trpc.videos.autoTagVideo.mutationOptions({
            onSuccess: (data) => {
                setSuggestedTags(data.topics.map(t => t.name));
                setShowAITags(true);
                toast.success(`Added ${data.tagsCount} tags and ${data.topicsCount} topics`)
            },
            onError: () => {
                toast.error("Failed to generate AI tags")
            }
        })
    );

 const reValidate =  useMutation(
    trpc.videos.reValidate.mutationOptions({
      onSuccess: () => {
        // Use .queryKey() instead of .queryOptions(...).queryKey
       queryClient.invalidateQueries({
        queryKey: trpc.studio.getOne.queryKey({ id: videoId }),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.studio.getMany.queryKey({ limit: DEFAULT_LIMIT }),
      });

        toast.success("This video revalidated successfully")
     
      },
      onError: (error) => {
      toast.error("Failed to delete video. Poor internet connection")
    },
    })
  );
   const restoreThumbnail = useMutation(
    trpc.videos.restoreThumbnail.mutationOptions({
      onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.studio.getOne.queryKey({ id: videoId }),
      });
  queryClient.refetchQueries({
           queryKey: trpc.studio.getMany.queryKey({limit: DEFAULT_LIMIT }),
         });
      queryClient.invalidateQueries({
        queryKey: trpc.studio.getMany.queryKey({ limit: DEFAULT_LIMIT }),
      });
 toast.success("Original Video Thumbnail Restored Sucessfully")
    
      },
      onError: (error) => {
     toast.error("Failed to restore video original thumbnail. Poor internet connection")
     },
    })
  );
 
    const remove = useMutation(
        trpc.videos.remove.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: trpc.studio.getMany.queryKey({ limit: DEFAULT_LIMIT }),
                });
                toast.success("Video removed successfully")
                router.push(`/studio`)
            },
            onError: () => {
                toast.error("Failed to delete video. Please try again.")
            },
        })
    );

    const form = useForm<z.infer<typeof videoUpdateSchema>>({
        resolver: zodResolver(videoUpdateSchema),
        defaultValues: video,
    })

    const onSubmit = (data: z.infer<typeof videoUpdateSchema>) => {
        update.mutate(data);
    }

    const fullUrl = `${APP_URL}/videos/${videoId}`
    const [isCopied, setIsCopied] = useState(false)

    const onCopy = async () => {
        await navigator.clipboard.writeText(fullUrl)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 3000);
    }

    return (
        <>
            <ThumbnailUploadModal open={modalOpen} onOpenChange={setModalOpen} videoId={videoId} />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Header - YouTube style */}
                    <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 px-6 -mx-6 border-b">
                        <div>
                            <h1 className="text-2xl font-bold">Video Details</h1>
                            <p className="text-sm text-muted-foreground">Manage your video metadata and visibility</p>
                        </div>
                        <div className="flex items-center gap-3">
                           
                            <Button type="submit" disabled={update.isPending} className="gap-2">
                                {update.isPending ? (
                                    <>
                                        <Loader2Icon className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVerticalIcon className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="text-destructive" onClick={() => remove.mutate({ id: videoId })}>
                                        <TrashIcon className="h-4 w-4 mr-2" />
                                        Delete video
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-5 mb-9 gap-6' >
                      <div className='space-y-8 lg:col-span-3' >
                            {/* Title */}
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold">Title</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field}
                                                placeholder="Add a title that describes your video"
                                                className="text-lg py-6"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Good titles help viewers find your content
                                        </p>
                                    </FormItem>
                                )}
                            />

                            {/* Description */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold">Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                value={field.value ?? ""}
                                                rows={8}
                                                placeholder="Tell viewers what your video is about..."
                                                className="resize-none"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                         <Button 
                                type="button"
                                variant="outline"
                                onClick={() => autoTagMutation.mutate({ videoId })}
                                disabled={autoTagMutation.isPending}
                                className="gap-2"
                            >
                                {autoTagMutation.isPending ? (
                                  <> <Loader2Icon className="h-4 w-4 animate-spin" /> Categorizing Video...</>
                                    
                                ) : (
                                   <> <Wand2Icon className="h-4 w-4" /> Auto-categorize Video</>
                                )}
                               
                            </Button>
                            {/* AI Tags Section */}
                            {( showAITags || suggestedTags.length > 0) && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <SparklesIcon className="h-4 w-4 text-primary" />
                                            Suggested Categories
                                        </CardTitle>
                                        <CardDescription>
                        Base on the information provided, your videos have been categorizes as follow
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm font-medium mb-2">Video Category</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {suggestedTags.map((tag) => (
                                                        <Badge key={tag} variant="secondary" className="gap-1 p-1">
                                                            <CheckCheckIcon className="h-3 w-3" />
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setShowAITags(false)}
                                            >
                                                <XIcon className="h-3 w-3 mr-1" />
                                                Dismiss
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Category Selection */}
                            {/* <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold">Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        {category.topicName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        <p className="text-xs text-muted-foreground">
                                            Choosing the right category helps viewers find your content
                                        </p>
                                    </FormItem>
                                )}
                            /> */}
<FormField
                                control={form.control}
                                name="videoVisibility"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold">Visibility</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select visibility" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="private">
                                                    <div className="flex items-center gap-2">
                                                        <LockIcon className="h-4 w-4" />
                                                        Private - Only you can view
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="public">
                                                    <div className="flex items-center gap-2">
                                                        <Globe2Icon className="h-4 w-4" />
                                                        Public - Everyone can view
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Performance Insights - YouTube Style */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <TrendingUpIcon className="h-4 w-4" />
                                        Performance Insights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Estimated Reach</p>
                                            <p className="text-2xl font-bold">-</p>
                                            <p className="text-xs text-muted-foreground">Based on similar content</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Suggested Audience</p>
                                            <p className="text-sm font-medium">Everyone</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Preview & Settings */}
                        <div className="flex flex-col space-y-6 lg:col-span-2">
                            {/* Video Preview Card */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Video Preview</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="aspect-video overflow-hidden rounded-lg bg-secondary">
                                        <VideoPlayer
                                            playbackId={video.muxPlaybakId}
                                            thumbnailUrl={video.thumbnailUrl}
                                            isShort={video.videoType === "short"}
                                        />
                                    </div>
                                     <Button type='button'
            variant="outline"
            onClick={() => reValidate.mutate({id: videoId})}
            className='flex gap-1 items-center' disabled={reValidate.isPending}>
              {!reValidate.isPending ? <> <RefreshCwIcon  /> Revalidate video </> : <> <Loader2Icon className='animate-spin' /> Revalidating...</>}
            </Button>
                                    {/* Thumbnail */}
                                    {/* <div>
                                        <p className="text-sm font-medium mb-2">Thumbnail</p>
                                        <div className="relative group w-[160px]">
                                            <div className="relative h-[90px] w-[160px] rounded-lg overflow-hidden border">
                                                <Image
                                                    fill
                                                    className="object-cover"
                                                    src={video.thumbnailUrl ?? THUMBNAIL_FALLBACK}
                                                    alt="thumbnail"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setModalOpen(true)}
                                            >
                                                <ImagePlusIcon className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div> */}
                                        <FormField
              name='thumbnailUrl'
              control={form.control}
              render={() => (
                <FormItem>
                  <FormLabel>Thumbnail</FormLabel>
                  <FormControl>
                    <div className='p-0.5 border border-dashed border-neutral-400 relative h-[84px]
                w-[153px] group
                '>
                      <Image
                        fill
                        className='object-cover'
                        src={video.thumbnailUrl ?? THUMBNAIL_FALLBACK}
                        alt='thumbnail'
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type='button'
                            size={"icon"}
                            className='bg-black/50 hover:bg-black/50 absolute top-1 right-1 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 duration-300 size-7'
                          >
                            <MoreVerticalIcon className='text-white' />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align='start' side='right'>

                          <DropdownMenuItem onClick={() => setModalOpen(true)}
                           className='cursor-pointer'>
                            <ImagePlusIcon className='size-4 mr-1' />
                            Change
                          </DropdownMenuItem>
                         
                          <DropdownMenuItem
                          onClick={() => restoreThumbnail.mutate({id: videoId})}
                          className='cursor-pointer'>
                            <RotateCcwIcon className='size-4 mr-1' />
                            Restore
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

                                </CardContent>
                            </Card>

                            {/* Video Details Card */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Video Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Video link</p>
                                        <div className="flex items-center gap-2">
                                            <a href={`/videos/${video.id}`} className="text-sm cursor-pointer text-blue-500 truncate flex-1">
                                                {fullUrl}
                                            </a>
                                            <Button type="button" variant="ghost" size="sm" onClick={onCopy}>
                                                <CopyIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className='flex items-center gap-2'>
                                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                                        <Badge variant={"secondary"}>
                                            {SnakeCaseTitle(video.muxStatus || "Preparing")}
                                        </Badge>
                                    </div>

                                     <div className='flex items-center gap-2'>
                                        <p className="text-sm text-muted-foreground mb-1">Visibility</p>
                                       
                                        <Badge variant={video.videoVisibility === "public" ? "default" : "secondary"}>
                                            {video.videoVisibility === "public" ? "Public (Everyone can view)" : "Private (Only you can view)"}
                                        </Badge>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Upload date</p>
                                        <p className="text-sm">
                                            {new Date(video.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            
                        </div>

                    </div>
                </form>
            </Form>
        </>
    )
}













// "use client"

// import { Button } from '@/components/ui/button';
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
// import { videoUpdateSchema } from '@/db/schema';
// import { useTRPC } from '@/trpc/client';
// import { CopyIcon, CornerRightUp, DeleteIcon, Globe2Icon, ImagePlusIcon, Loader2Icon, LockIcon, MoreVerticalIcon, RefreshCcw, RefreshCwIcon, RotateCcwIcon, SparklesIcon, TrashIcon, WifiOff } from 'lucide-react';
// import React, { Suspense, useState } from 'react'
// import { zodResolver } from "@hookform/resolvers/zod"
// import { ErrorBoundary } from 'react-error-boundary';
// import { useForm } from 'react-hook-form';
// import z from 'zod';
// import { SnakeCaseTitle } from "@/lib/utils";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { toast } from 'sonner';
// import { VideoPlayer } from '@/modules/videos/ui/components/video-player';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { Skeleton } from '@/components/ui/skeleton';
// import Image from 'next/image';
// import { THUMBNAIL_FALLBACK } from '@/modules/videos/constants';
// import { ThumbnailUploadModal } from '../../components/thumbnail-upload';
// import { APP_URL,  DEFAULT_LIMIT } from '@/constants';
// import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

// interface FormProps {
//   videoId: string;
// }
// export function FormSection({ videoId }: FormProps) {

//   return (
//     <Suspense fallback={<FormSectionSkeleton />}>
//       <ErrorBoundary
//         fallbackRender={({ resetErrorBoundary }) => (
//           <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 p-8 text-center border-y bg-transparent">
//             <WifiOff className="h-16 w-16 text-muted-foreground/70" strokeWidth={1.5} />

//             <div className="space-y-2">
//               <h3 className="text-xl font-medium">You're offline</h3>
//               <p className="text-muted-foreground max-w-md">
//                 Check your internet connection and try again.
//                 This page requires an active connection to load your videos.
//               </p>
//             </div>

//             <Button
//               variant="outline"
//               size="lg"
//   //             onClick={() =>{
//   //               const [video] = trpc.studio.getOne.useSuspenseQuery({ id: videoId })
//   // const [categories] = trpc.categories.getMany.useSuspenseQuery()
//   // const utils = trpc.useUtils()
//   //    utils.studio.getMany.invalidate();
//   //     utils.studio.getOne.invalidate({ id: videoId })
//   //               //window.location.reload();
//   //             }}
//               className="gap-2"
//             >
//               <RefreshCcw className="h-4 w-4" />
//               Retry
//             </Button>

//             <p className="text-xs text-muted-foreground mt-4">
//               If the problem continues, check your network or try again later.
//             </p>
//           </div>
//         )}
//       >
//         <FormSectionSuspense videoId={videoId} />
//       </ErrorBoundary>
//     </Suspense>
//   )
// }
// export function FormSectionSkeleton() {
//   return (
//     <div className="space-y-8">
//       {/* Header area - title + actions */}
//       <div className="flex items-center justify-between mb-6">
//         <div className="space-y-2">
//           <Skeleton className="h-8 w-64" />           {/* "Video Details" title */}
//           <Skeleton className="h-4 w-48" />           {/* subtitle */}
//         </div>
//         <div className="flex items-center gap-3">
//           <Skeleton className="h-10 w-24 rounded-md" />   {/* Save button */}
//           <Skeleton className="h-10 w-10 rounded-md" />   {/* More menu icon */}
//         </div>
//       </div>

//       {/* Main grid layout - same as real component */}
//       <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
//         {/* Left column - form fields */}
//         <div className="space-y-10 lg:col-span-3">
//           {/* Title field */}
//           <div className="space-y-2">
//             <Skeleton className="h-5 w-16" />           {/* Label */}
//             <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
//           </div>

//           {/* Description field */}
//           <div className="space-y-2">
//             <Skeleton className="h-5 w-24" />
//             <Skeleton className="h-56 w-full rounded-md" /> {/* Tall textarea */}
//           </div>

//             <div className="space-y-2">
//             <Skeleton className="h-5 w-24" />
//             <Skeleton className="rounded-md relative h-[84px]
//                 w-[153px] group" /> {/* Tall textarea */}
//           </div>

          


//           {/* Category select */}
//           <div className="space-y-2">
//             <Skeleton className="h-5 w-20" />
//             <Skeleton className="h-10 w-full rounded-md" />
//           </div>
//         </div>

//         {/* Right column - video preview + metadata */}
//         <div className="lg:col-span-2 space-y-8">
//           {/* Video player area + card */}
//           <div className="rounded-xl overflow-hidden border bg-transparent">
//             {/* Video preview */}
//             <Skeleton className="aspect-video w-full rounded-t-xl" />

//             {/* Metadata blocks inside card */}
//             <div className="p-5 space-y-6">
//               {/* Video link block */}
//               <div className="space-y-2">
//                 <Skeleton className="h-4 w-24" />           {/* "Video link" label */}
//                 <div className="flex items-center gap-2">
//                   <Skeleton className="h-5 flex-1" />
//                   <Skeleton className="h-8 w-8 rounded-md" /> {/* Copy icon */}
//                 </div>
//               </div>

//               {/* Video Status */}
//               <div className="flex justify-between items-center">
//                 <div className="space-y-1.5">
//                   <Skeleton className="h-4 w-28" />
//                   <Skeleton className="h-5 w-32" />
//                 </div>
//               </div>

//               {/* Subtitles Status */}
//               <div className="flex justify-between items-center">
//                 <div className="space-y-1.5">
//                   <Skeleton className="h-4 w-32" />
//                   <Skeleton className="h-5 w-40" />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Visibility field (below the card in your layout) */}
//           <div className="space-y-2">
//             <Skeleton className="h-5 w-20" />
//             <Skeleton className="h-10 w-full rounded-md" />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export function FormSectionSuspense({ videoId }: FormProps) {
//   const router = useRouter()
//   const [modalOpen, setModalOpen] = useState(false)
//   const trpc = useTRPC();
//     const queryClient = useQueryClient();
//   const videoQuery = useSuspenseQuery(
//       trpc.studio.getOne.queryOptions(
//         { id: videoId }
//       )
//     );
  
//     const video = videoQuery.data;

//      const categoriesQuery = useSuspenseQuery(
//       trpc.categories.getMany.queryOptions()
//     );
  
//     const categories = categoriesQuery.data;

//   const update = useMutation(
//     trpc.videos.update.mutationOptions({
//       onSuccess: () => {
//         // Use .queryKey() instead of .queryOptions(...).queryKey
//        queryClient.invalidateQueries({
//         queryKey: trpc.studio.getOne.queryKey({ id: videoId }),
//       });

//       queryClient.invalidateQueries({
//         queryKey: trpc.studio.getMany.queryKey({ limit: DEFAULT_LIMIT }),
//       });

//         toast.success("Video updated sucessfully")
//       },
//       onError: (error) => {
//       toast.error("Failed to save video. Poor internet connection")
//     },
//     })
//   );
  
    


//   const remove = useMutation(
//     trpc.videos.remove.mutationOptions({
//       onSuccess: () => {
    
//       queryClient.invalidateQueries({
//         queryKey: trpc.studio.getMany.queryKey({ limit: DEFAULT_LIMIT }),
//       });

//        toast.success("Video removed sucessfully")
//       router.push(`/studio`)
//       },
//        onError: (error) => {
//       toast.error("Failed to delete video. Poor internet connection")
//         },
//     })
//   );


//    const reValidate =  useMutation(
//     trpc.videos.reValidate.mutationOptions({
//       onSuccess: () => {
//         // Use .queryKey() instead of .queryOptions(...).queryKey
//        queryClient.invalidateQueries({
//         queryKey: trpc.studio.getOne.queryKey({ id: videoId }),
//       });

//       queryClient.invalidateQueries({
//         queryKey: trpc.studio.getMany.queryKey({ limit: DEFAULT_LIMIT }),
//       });

//         toast.success("This video revalidated successfully")
     
//       },
//       onError: (error) => {
//       toast.error("Failed to delete video. Poor internet connection")
//     },
//     })
//   );


//    const restoreThumbnail = useMutation(
//     trpc.videos.restoreThumbnail.mutationOptions({
//       onSuccess: () => {
//         // Use .queryKey() instead of .queryOptions(...).queryKey
//        queryClient.invalidateQueries({
//         queryKey: trpc.studio.getOne.queryKey({ id: videoId }),
//       });
//   queryClient.refetchQueries({
//            queryKey: trpc.studio.getMany.queryKey({limit: DEFAULT_LIMIT }),
//          });
//       queryClient.invalidateQueries({
//         queryKey: trpc.studio.getMany.queryKey({ limit: DEFAULT_LIMIT }),
//       });
//  toast.success("Original Video Thumbnail Restored Sucessfully")
    
//       },
//       onError: (error) => {
//      toast.error("Failed to restore video original thumbnail. Poor internet connection")
//      },
//     })
//   );
 
//   const form = useForm<z.infer<typeof videoUpdateSchema>>({
//     resolver: zodResolver(videoUpdateSchema),
//     defaultValues: video,
//   })

//   const onSubmit = (data: z.infer<typeof videoUpdateSchema>) => {
//     update.mutate(data);
//   }


//   const fullUrl = `${APP_URL}/videos/${videoId}`

//   const [isCopied, setIsCopied] = useState(false)

//   const onCopy = async () => {
//     await navigator.clipboard.writeText(fullUrl)
//     setIsCopied(true)

//     setTimeout(() => {
//       setIsCopied(false);
//     }, 3000);
//   }
//   return (
//     <>
        
//         <ThumbnailUploadModal
//         open={modalOpen}
//         onOpenChange={setModalOpen}
//         videoId={videoId}
//         />

//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)}>
//         <div className='flex items-center justify-between mb-6'>
//           <div>
//             <h1 className='text-2xl font-bold'>Video Details</h1>
//             <p className='tex-xs text-muted-foreground'>Manage your video details</p>
//           </div>

//           <div className='flex items-center gap-x-2'>
//             <Button type='button'
//             variant="outline"
//             onClick={() => reValidate.mutate({id: videoId})}
//             className='flex gap-1 items-center' disabled={reValidate.isPending}>
//               {!reValidate.isPending ? <> <RefreshCwIcon  /> Revalidate </> : <> <Loader2Icon className='animate-spin' /></>}
//             </Button>

//             <Button type='submit' className='flex gap-1 items-center' disabled={update.isPending}>
//               {!update.isPending ? "Save" : <> <Loader2Icon className='animate-spin' /> Saving... </>}
//             </Button>

//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button variant={"ghost"} size={"icon"}>
//                   <MoreVerticalIcon />
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align='start'>
//                 <DropdownMenuItem className='cursor-pointer' onClick={() => remove.mutate({ id: videoId })}>
//                   <TrashIcon className='size-4 mr-2' /> Delete
//                 </DropdownMenuItem>

//               </DropdownMenuContent>

//             </DropdownMenu>
//           </div>
//         </div>

//         <div className='grid grid-cols-1 lg:grid-cols-5 mb-9 gap-6' >
//           <div className='space-y-8 lg:col-span-3' >
//             <FormField
//               control={form.control}
//               name='title'
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Title</FormLabel>
//                   <FormControl>
//                     <Input  {...field}
//                       placeholder='Add a title to your video'
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name='description'
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Description</FormLabel>
//                   <FormControl>
//                     <Textarea  {...field}
//                       value={field.value ?? ""}
//                       rows={10}
//                       className='resize-none'
//                       placeholder='Add a description to your video'
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               name='thumbnailUrl'
//               control={form.control}
//               render={() => (
//                 <FormItem>
//                   <FormLabel>Thumbnail</FormLabel>
//                   <FormControl>
//                     <div className='p-0.5 border border-dashed border-neutral-400 relative h-[84px]
//                 w-[153px] group
//                 '>
//                       <Image
//                         fill
//                         className='object-cover'
//                         src={video.thumbnailUrl ?? THUMBNAIL_FALLBACK}
//                         alt='thumbnail'
//                       />
//                       <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                           <Button
//                             type='button'
//                             size={"icon"}
//                             className='bg-black/50 hover:bg-black/50 absolute top-1 right-1 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 duration-300 size-7'
//                           >
//                             <MoreVerticalIcon className='text-white' />
//                           </Button>
//                         </DropdownMenuTrigger>

//                         <DropdownMenuContent align='start' side='right'>

//                           <DropdownMenuItem onClick={() => setModalOpen(true)}
//                            className='cursor-pointer'>
//                             <ImagePlusIcon className='size-4 mr-1' />
//                             Change
//                           </DropdownMenuItem>
//                           {/* <DropdownMenuItem className='cursor-pointer'>
//                             <SparklesIcon className='size-4 mr-1' />
//                             AI-Generated
//                           </DropdownMenuItem> */}
//                           <DropdownMenuItem
//                           onClick={() => restoreThumbnail.mutate({id: videoId})}
//                           className='cursor-pointer'>
//                             <RotateCcwIcon className='size-4 mr-1' />
//                             Restore
//                           </DropdownMenuItem>
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                     </div>
//                   </FormControl>
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name='categoryId'
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Category</FormLabel>
//                   <Select
//                     onValueChange={field.onChange}
//                     defaultValue={field.value ?? undefined}
//                   >
//                     <FormControl>

//                       <SelectTrigger>
//                         <SelectValue placeholder="select a Category" />
//                       </SelectTrigger>
//                     </FormControl>

//                     <SelectContent>
//                       {categories.map((category) => (
//                         <SelectItem key={category.id} value={category.id}>
//                           {category.name}
//                         </SelectItem>)
//                       )}
//                     </SelectContent>
//                   </Select>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//           </div>


//           <div className='flex flex-col gap-y-8 space-y-8 lg:col-span-2'>
//             <div className='flex flex-col gap-4 rounded-xl overflow-hidden w-full h-fit bg-secondary'>
//               <div className='aspect-video overflow-hidden relative'>

//                 <VideoPlayer
//                   playbackId={video.muxPlaybakId}
//                   thumbnailUrl={video.thumbnailUrl}
//                   isShort={video.videoType === "short"}
//                 />
//               </div>
//               <div>
//                 <div className='p-4 flex flex-col gap-y-6'>
//                   <div className='flex justify-between items-center gap-x-2'>
//                     <div className='flex flex-col gap-y-1'>
//                       <p className='text-muted-foreground  text-xs'>
//                         Video link
//                       </p>
//                       <div className='flex items-center gap-x-2'>
//                         <a href={`/videos/${video.id}`}>
//                           <p className='line-clamp-1 text-sm text-blue-500'>
//                             {fullUrl}
//                           </p>
//                         </a>

//                         <Button type='button'
//                           variant={"ghost"}
//                           size={"icon"}
//                           className='shrink-0'
//                           onClick={onCopy}
//                           disabled={false}
//                         >
//                           <CopyIcon />
//                         </Button>
//                       </div>
//                     </div>
//                   </div>


//                   <div className="flex justify-between items-center">
//                     <div className="flex flex-col gap-y-1">
//                       <p className='text-xs text-muted-foreground'>Video Status</p>
//                       <p className='text-sm'>
//                         {
//                           SnakeCaseTitle(video.muxStatus || "Preparing")
//                         }
//                       </p>
//                     </div>
//                   </div>

//                   <div className="flex justify-between items-center">
//                     <div className="flex flex-col gap-y-1">
//                       <p className='text-xs text-muted-foreground'>Subtitles Status</p>
//                       <p className='text-sm'>
//                         {
//                           SnakeCaseTitle(video.muxTrackStatus || "No Subtitles for this video")
//                         }
//                       </p>
//                     </div>
//                   </div>


//                 </div>
//               </div>

//             </div>


//             <FormField
//               control={form.control}
//               name="videoVisibility"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Visibility</FormLabel>
//                   <Select
//                     onValueChange={field.onChange}
//                     defaultValue={field.value ?? undefined}
//                   >
//                     <FormControl>

//                       <SelectTrigger>
//                         <SelectValue placeholder="select visibility" />
//                       </SelectTrigger>
//                     </FormControl>

//                     <SelectContent>
//                       <SelectItem value="private">
//                         <div className='flex items-center gap-2'>
//                           <LockIcon className='size-4 mr-2' />
//                           Private
//                         </div>
//                       </SelectItem>
//                       <SelectItem value="public">
//                         <div className='flex items-center gap-2'>
//                           <Globe2Icon className='size-4 mr-2' />
//                           Public
//                         </div>

//                       </SelectItem>

//                     </SelectContent>
//                   </Select>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />



//           </div>



//         </div>
//       </form>
//     </Form>

    

//     </>

//   )
// }
