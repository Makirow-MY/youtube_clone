"use client";

import { useState } from "react";
import { X, Heart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CommentsPageSection } from "../../sections/comments-section";



interface CommentsDrawerProps {
  onClose: () => void;
  videoId: string;
}

export const CommentsDrawer = ({ onClose, videoId }: CommentsDrawerProps) => {

  return (
    <div className="absolute inset-0 z-50 bg-white/35 backdrop-blur-md">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
      
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

  <CommentsPageSection videoId={videoId} />
    </div>
  );
};

