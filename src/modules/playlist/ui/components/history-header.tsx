"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface HistoryHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function HistoryHeader({ searchQuery, onSearchChange }: HistoryHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-6">Watch history</h1>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search watch history"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}