"use client"

import { ResponsiveModal } from "@/components/responsive-dialog"
import { Button } from "@/components/ui/button"
import { useTRPC } from "@/trpc/client"
import { Loader2Icon, PlusIcon, VideoIcon, VideotapeIcon, ZapIcon } from "lucide-react"
import { toast } from "sonner"
import { StudioUploader } from "./studio-uploader"
import { useRouter } from "next/navigation"
import { nullish } from "zod"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { DEFAULT_LIMIT } from "@/constants"


export const StudioUploadModal = () => {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
    const router = useRouter()
    const create = useMutation(
    trpc.videos.create.mutationOptions({
      onSuccess: () => {
      

      queryClient.invalidateQueries({
        queryKey: trpc.studio.getMany.queryKey({ limit: DEFAULT_LIMIT }),
      });

        toast.success("This video creation commences successfully")
     
      },
      onError: (error) => {
       toast.error(`❌ Failed to create. Poor internet connection!`)
  },
    })
  );
 

    const createShort = useMutation(
    trpc.videos.createShort.mutationOptions({
      onSuccess: () => {
      

      queryClient.invalidateQueries({
        queryKey: trpc.studio.getMany.queryKey({ limit: DEFAULT_LIMIT }),
      });

        toast.success("This short creation commences successfully")
     
      },
      onError: (error) => {
       toast.error(`❌ Failed to create. Poor internet connection!`)
  },
    })
  );
   

    const onSucess = (data: any) => {

        if (!data?.video?.id) return;
        create.reset();
        createShort.reset();
        toast.success(data.type === "short" ? "Short upload started" : "Video upload started");
        router.push(`/studio/videos/${data.video.id}`);

    }

    return (
        <>
            <ResponsiveModal
                title={createShort.data?.type === "short" ? "Upload Short" : "Upload Video"}
                open={!!create.data?.url || !!createShort.data?.url}
                onOpenChange={() => {
                    create.reset();
                    createShort.reset();
                }}
            >
                {(create.data?.url || createShort.data?.url) ? <StudioUploader
                    onSucess={() => onSucess(create.data || createShort.data)}
                    enpoint={create.data?.url || createShort.data?.url || null}
                /> : <Loader2Icon className="animate-spin" />}
            </ResponsiveModal>
            {create.isPending && <Button variant="secondary"
                disabled={true}
            > <Loader2Icon className="animate-spin" /> Creating...
            </Button>}

           
             <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       {(!create.isPending || !createShort.isPending) && <Button variant="secondary"
                disabled={false}
            >
                <PlusIcon />
                Create
            </Button>}
                    </DropdownMenuTrigger>
            
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      {/* SHARE – now opens the full YouTube-style dialog */}
                      <DropdownMenuItem
                        onClick={() => create.mutate()} 
                       disabled={create.isPending}

                        className="cursor-pointer"
                      >
                        <VideoIcon className="mr-2 size-4" />
                        Video
                      </DropdownMenuItem>
            
                     <DropdownMenuItem
                     onClick={() => createShort.mutate()} 
          disabled={createShort.isPending}
                     className="cursor-pointer">
                        <ZapIcon className="mr-2 size-4" />
                        Shorts
                      </DropdownMenuItem>
                 
                    </DropdownMenuContent>
                  </DropdownMenu>
        </>
    )
}
