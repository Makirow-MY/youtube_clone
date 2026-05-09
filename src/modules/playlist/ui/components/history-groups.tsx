"use client";

import { format, isToday, isYesterday, subDays, formatDistanceToNow } from "date-fns";
import { VideoRowCard } from "@/modules/videos/ui/components/video-row-card";
import { VideoGridCard } from "@/modules/videos/ui/components/video-grid-card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface HistoryGroupsProps {
  groupedVideos: Record<string, any[]>;
  onRemoveFromHistory: (videoId: string) => Promise<void>;
}

export function HistoryGroups({ groupedVideos, onRemoveFromHistory }: HistoryGroupsProps) {
  const groupKeys = Object.keys(groupedVideos).sort((a, b) => {
    // Sort groups: Today, Yesterday, then by date descending
    if (a === "Today") return -1;
    if (b === "Today") return 1;
    if (a === "Yesterday") return -1;
    if (b === "Yesterday") return 1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div className="space-y-10">
      {groupKeys.map((dateLabel) => (
        <div key={dateLabel}>
          <h2 className="text-xl font-semibold mb-4">{dateLabel}</h2>
          <div className="space-y-4">
            {groupedVideos[dateLabel].map((video) => (
              <div key={video.id} className="group relative">
                <div className="md:hidden">
                  <VideoGridCard data={video} />
                </div>
                <div className="hidden md:block">
                  <VideoRowCard size="compact" data={video} />
                </div>

                {/* Remove from history button (top-right on hover) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveFromHistory(video.id)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to group videos by date
