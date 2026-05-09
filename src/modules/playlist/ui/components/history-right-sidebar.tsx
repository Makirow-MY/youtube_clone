"use client";

import { Button } from "@/components/ui/button";
import { Search, Trash2, Pause, Settings } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";

interface HistoryHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}


export function HistoryRightSidebar({ searchQuery, onSearchChange }: HistoryHeaderProps) {
  // const utils = trpc.useUtils();

  const clearAllHistory = async () => {
    if (!confirm("Clear all watch history? This cannot be undone.")) return;
    // Add mutation later
    toast.success("Watch history cleared");
    //  utils.playList.getHistory.invalidate();
  };

  const pauseHistory = () => {
    toast.info("Watch history paused (feature coming soon)");
    // You can add a real setting in your user preferences later
  };

  return (
    <div className="sticky top-20 space-y-2">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search watch history"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:text-red-700" onClick={clearAllHistory}>
        <Trash2 className="size-5" />
        Clear all watch history
      </Button>

      <Button variant="ghost" className="w-full justify-start gap-3" onClick={pauseHistory}>
        <Pause className="size-5" />
        Pause watch history
      </Button>

      <Button variant="ghost" className="w-full justify-start gap-3" asChild>
        <a href="/settings/history" target="_blank">
          <Settings className="size-5" />
          Manage all history
        </a>
      </Button>
    </div>
  );
}