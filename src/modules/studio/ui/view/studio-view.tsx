import { VideoSection } from "../sections/video-section"

export const StudioView = async() => {
    return(
        <div className="flex flex-col gap-y-6 pt-2.5">
            <div className="px-4">
                 <h1 className="text-2xl font-bold ">My Channel Content</h1>
                 <p className="text-xs text-muted-foreground">Manage your channel content and videos with ease</p>
            </div>
          <VideoSection />
        </div>    
    )
}