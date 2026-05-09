import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { DashboardSection } from "../sections/dashboard-section";

export default function StudioDashboardView() {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Studio Dashboard</h1>
          <p className="text-muted-foreground">Overview of your channel performance</p>
        </div>
        <Button size="lg">
          <Play className="mr-2 h-5 w-5" />
          Upload Video
        </Button>
      </div>

     <DashboardSection />
    </div>
  );
}