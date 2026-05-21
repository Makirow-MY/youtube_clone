import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { DashboardSection } from "../sections/dashboard-section";
import { StudioUploadModal } from "../../components/studio-upload-modal";

export default function StudioDashboardView() {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Studio Dashboard</h1>
          <p className="text-muted-foreground">Overview of your channel performance</p>
        </div>
        <StudioUploadModal className={"rounded-full px-10 py-7 text-base font-medium shadow-md hover:shadow-lg transition-all"} />
      </div>

     <DashboardSection />
    </div>
  );
}