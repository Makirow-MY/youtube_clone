
import { ResponsiveModal } from "@/components/responsive-dialog";
import { DEFAULT_LIMIT } from "@/constants";
import { UploadDropzone } from "@/lib/uploadthing";
import { useTRPC } from "@/trpc/client";
import { useQueryClient } from "@tanstack/react-query";

interface ThumbnailUploadModalProps {
    videoId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ThumbnailUploadModal = ({
 videoId,
open,
onOpenChange
}: ThumbnailUploadModalProps) =>{
 const trpc = useTRPC();
   const queryClient = useQueryClient();
 

    const onUploadComplete = () =>{
        onOpenChange(false);
        queryClient.invalidateQueries({
        queryKey: trpc.studio.getMany.queryKey({ limit: DEFAULT_LIMIT }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.studio.getOne.queryKey({id: videoId}),
      });

        
    }

return(
    <ResponsiveModal
    title="Upload a thumbnail"
    open={open}
    onOpenChange={onOpenChange}
    >
         <UploadDropzone 
         endpoint={"thumbnailUploader"}
         input={{videoId}}
         onClientUploadComplete={onUploadComplete}
         />
    </ResponsiveModal>
)

}