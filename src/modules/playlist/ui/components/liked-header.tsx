"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface LikedHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
}

export function LikedHeader({ searchQuery, onSearchChange, totalCount }: LikedHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Liked videos</h1>
        <p className="text-sm text-muted-foreground">{totalCount} videos</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search liked videos"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}