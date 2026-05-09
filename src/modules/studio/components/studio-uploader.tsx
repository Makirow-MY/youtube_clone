import { Button } from "@/components/ui/button";
import MuxUploader, { MuxUploaderDrop, MuxUploaderFileSelect, MuxUploaderProgress, MuxUploaderStatus } from "@mux/mux-uploader-react";
import { ImportIcon, UploadIcon } from "lucide-react";

interface StudioUploaderProps {
    onSucess: () => void;
    enpoint?: string | null
}


export function StudioUploader({onSucess, enpoint}: StudioUploaderProps) {
  return (
    <div>
       <MuxUploader onSuccess={onSucess} endpoint={enpoint} 
       id="video-uploader"
       className="hidden group/uploader"
       />
       <MuxUploaderDrop muxUploader="video-uploader" className="group/drop">
         <div slot="heading" className="
         flex flex-col items-center gap-6">
          <div className="flex items-center justify-center bg-muted rounded-full h-32 w-32">
             <UploadIcon className="size-10 text-muted-foreground group/drop-[&[active]]:animate-bounce transition-all duration-300" />
          </div>

          <div className="flex flex-col gap-2 text-center">
             <p className="text-sm">
                    Drag and drop vide files to upload
             </p>
             <p className="text-xs text-muted-foreground">
                   Your videos will be private until you sucessfully publish them
             </p>
          </div>

          <MuxUploaderFileSelect muxUploader="video-uploader">
                <Button variant={"default"} className="flex items-center gap-2 rounded-full" type="button">
                 <ImportIcon /> Import Files
                </Button>
          </MuxUploaderFileSelect>

         </div>
         <span slot="separator" className="hidden"/>
         <MuxUploaderStatus 
            muxUploader="video-uploader"
            className="text-sm"
         />
         <MuxUploaderProgress 
         muxUploader="video-uploader"
         className="text-sm"
         type="percentage"
         />
          <MuxUploaderProgress 
         muxUploader="video-uploader"
         type="bar"
         />
       </MuxUploaderDrop>
    </div>
  )
}
