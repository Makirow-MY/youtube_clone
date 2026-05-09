"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { useRouter } from "next/navigation";
import {
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  MoreHorizontal,
  X,
  Maximize2,
  Minimize2,
  Music2,
  UserPlus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
//import { formatCompactNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CommentsDrawer } from "./commentDrawer";

interface ShortsPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  channelName: string;
  channelAvatar: string;
  channelId: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  musicTitle?: string;
  isLiked?: boolean;
  isDisliked?: boolean;
  isSubscribed?: boolean;
  onLike?: () => void;
  onDislike?: () => void;
  onSubscribe?: () => void;
  onShare?: () => void;
  onComment?: () => void;
}

export const ShortsPlayer = ({
  videoUrl,
  thumbnailUrl,
  title,
  channelName,
  channelAvatar,
  channelId,
  viewCount,
  likeCount,
  commentCount,
  musicTitle,
  isLiked = false,
  isDisliked = false,
  isSubscribed = false,
  onLike,
  onDislike,
  onSubscribe,
  onShare,
  onComment,
}: ShortsPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isLikedState, setIsLikedState] = useState(isLiked);
  const [isDislikedState, setIsDislikedState] = useState(isDisliked);
  const [likeCountState, setLikeCountState] = useState(likeCount);
  const [isSubscribedState, setIsSubscribedState] = useState(isSubscribed);
  const [showComments, setShowComments] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout>();
  
  const playerRef = useRef<HTMLTemplateElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

   const compctViews = useMemo (() => {
          return new Intl.NumberFormat("en", {
              notation: "compact",
           //   compactDisplay: "short"
          }).format(viewCount)
      }, [viewCount]) 
   const compctlikeCountState = useMemo (() => {
          return new Intl.NumberFormat("en", {
              notation: "compact",
           //   compactDisplay: "short"
          }).format(likeCountState)
      }, [likeCountState]) 
  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      const timeout = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [showControls]);

  const handleUserInteraction = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeout = setTimeout(() => setShowControls(false), 3000);
    setControlsTimeout(timeout);
  }, [controlsTimeout]);

  // Handle like
  const handleLike = () => {
    if (isLikedState) {
      setLikeCountState(likeCountState - 1);
      setIsLikedState(false);
    } else {
      setLikeCountState(likeCountState + 1);
      setIsLikedState(true);
      if (isDislikedState) {
        setIsDislikedState(false);
      }
    }
    onLike?.();
  };

  // Handle dislike
  const handleDislike = () => {
    if (isDislikedState) {
      setIsDislikedState(false);
    } else {
      setIsDislikedState(true);
      if (isLikedState) {
        setLikeCountState(likeCountState - 1);
        setIsLikedState(false);
      }
    }
    onDislike?.();
  };

  // Handle subscribe
  const handleSubscribe = () => {
    setIsSubscribedState(!isSubscribedState);
    onSubscribe?.();
  };

  // Handle fullscreen
  const handleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Toggle play/pause
  const togglePlay = () => {
    if (playerRef.current) {
    //   if (isPlaying) {
    //  playerRef.current.pause();
    //   } else {
    //     playerRef.current.play();
    //   }
      setIsPlaying(!isPlaying);
    }
  };

  // Navigate to previous/next short (simulated)
  const handlePrevious = () => {
    router.back();
  };

  const handleNext = () => {
    // Implement next short navigation
    console.log("Next short");
  };

  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-full bg-black overflow-hidden"
      onMouseMove={handleUserInteraction}
      onClick={togglePlay}
    >
      {/* Video Player */}
      <MuxPlayer
        //ref={playerRef}
        src={videoUrl}
        poster={thumbnailUrl}
        muted={isMuted}
        volume={volume}
        autoPlay="muted"
        loop
        className="absolute inset-0 w-full h-full object-cover"
       // style={{ "--controls": "none" } as React.CSSProperties}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Gradient Overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

      {/* Top Controls */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 p-4 flex justify-between items-start transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Left side - Volume & Menu */}
        <div className="flex items-center gap-3">
          {/* Volume Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10 backdrop-blur-sm"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
            >
              {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>

            {/* Volume Slider */}
            {showVolumeSlider && (
              <div
                className="absolute bottom-12 left-0 bg-black/80 backdrop-blur-sm rounded-lg p-3 w-32"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    setIsMuted(val === 0);
                  }}
                  className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            )}
          </div>

          {/* Menu Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10 backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuItem>Save to playlist</DropdownMenuItem>
              <DropdownMenuItem>Not interested</DropdownMenuItem>
              <DropdownMenuItem>Report</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side - Close & Fullscreen */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleFullscreen();
            }}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10 backdrop-blur-sm"
            onClick={() => router.back()}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

   

      {/* Navigation Arrows (for multiple shorts) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/40 hover:bg-black/60 rounded-full h-10 w-10 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/40 hover:bg-black/60 rounded-full h-10 w-10 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress Bar (YouTube-style thin line at bottom) */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
        <div className="h-full bg-red-600 w-0 animate-pulse" />
      </div>

     
    </div>
  );
};