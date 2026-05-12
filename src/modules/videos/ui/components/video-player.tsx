"use client";

import MuxPlayer from "@mux/mux-player-react";
import { useRef, useState, useEffect } from "react";
import { THUMBNAIL_FALLBACK } from "../../constants";

interface VideoPlayerProps {
  playbackId?: string | null | undefined;
  isShort?: boolean;
  thumbnailUrl?: string | null | undefined;
  autoPlay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  defaultVolume?: number;
  defaultQuality?: string | "auto" | "2160p" | "1440p" | "1080p" | "720p" | "480p" | "360p";
  showControls?: boolean;
  loop?: boolean;
}

export const VideoPlayer = ({
  playbackId,
  autoPlay = false,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  thumbnailUrl,
  isShort,
  defaultVolume = 0.5,
  defaultQuality = "auto",
  showControls = true,
  loop = false,
  playlistId,
  currentVideoId,
  onPlaylistNext,
}: VideoPlayerProps & {
  playlistId?: string;
  currentVideoId: string;
  onPlaylistNext?: () => void;}) => {
  const playerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(defaultVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState(defaultQuality);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcutsHint, setShowShortcutsHint] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // YouTube-like keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const player = playerRef.current;
      if (!player) return;

      // Don't trigger if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          if (isPlaying) {
            player.pause();
          } else {
            player.play();
          }
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "arrowleft":
          e.preventDefault();
          seekBy(-5);
          break;
        case "arrowright":
          e.preventDefault();
          seekBy(5);
          break;
        case "arrowup":
          e.preventDefault();
          changeVolume(0.05);
          break;
        case "arrowdown":
          e.preventDefault();
          changeVolume(-0.05);
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          e.preventDefault();
          seekToPercentage(parseInt(e.key) * 10);
          break;
        case ">":
        case ".":
          e.preventDefault();
          increasePlaybackRate();
          break;
        case "<":
        case ",":
          e.preventDefault();
          decreasePlaybackRate();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying]);

  // Show shortcuts hint temporarily
  useEffect(() => {
    if (showShortcutsHint) {
      const timer = setTimeout(() => setShowShortcutsHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showShortcutsHint]);

  // YouTube-like quality preferences
  const qualities = [
    { label: "Auto", value: "auto" },
    { label: "2160p (4K)", value: "2160p", height: 2160 },
    { label: "1440p (2K)", value: "1440p", height: 1440 },
    { label: "1080p (HD)", value: "1080p", height: 1080 },
    { label: "720p (HD)", value: "720p", height: 720 },
    { label: "480p", value: "480p", height: 480 },
    { label: "360p", value: "360p", height: 360 },
  ];

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Player event handlers
  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handlePause = () => {
    setIsPlaying(false);
    onPause?.();
  };

  const handleEnded = () => {
    setIsPlaying(false);
   // Playlist continuation takes priority
    if (playlistId && onPlaylistNext) {
      onPlaylistNext();
    } else {
      onEnded?.();
    }
  };

  const handleTimeUpdate = () => {
    const player = playerRef.current;
    if (player) {
      const time = player.currentTime || 0;
      const dur = player.duration || 0;
      setCurrentTime(time);
      setDuration(dur);
      onTimeUpdate?.(time, dur);
    }
  };

  const handleVolumeChange = () => {
    const player = playerRef.current;
    if (player) {
      const newVolume = player.volume || 0;
      setVolume(newVolume);
      setIsMuted(player.muted || false);
    }
  };

  const handleLoadedMetadata = () => {
    const player = playerRef.current;
    if (player) {
      setDuration(player.duration);
      setVolume(player.volume);
      setIsMuted(player.muted);
      setIsLoaded(true);
    }
  };

  const handleQualityChange = (quality: string) => {
    const player = playerRef.current;
    if (player && player.preferredQuality) {
      player.preferredQuality = quality === "auto" ? undefined : quality;
      setSelectedQuality(quality);
    }
  };

  // Utility functions
  const togglePlay = () => {
    const player = playerRef.current;
    if (player) {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (player) {
      player.muted = !isMuted;
    }
  };

  const changeVolume = (delta: number) => {
    const player = playerRef.current;
    if (player) {
      let newVolume = volume + delta;
      newVolume = Math.max(0, Math.min(1, newVolume));
      player.volume = newVolume;
      if (newVolume === 0) {
        player.muted = true;
      } else if (isMuted) {
        player.muted = false;
      }
    }
  };

  const seekBy = (seconds: number) => {
    const player = playerRef.current;
    if (player) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      player.currentTime = newTime;
    }
  };

  const seekToPercentage = (percentage: number) => {
    const player = playerRef.current;
    if (player) {
      player.currentTime = (duration * percentage) / 100;
    }
  };

  const increasePlaybackRate = () => {
    const currentIndex = playbackRates.indexOf(playbackRate);
    const nextIndex = Math.min(currentIndex + 1, playbackRates.length - 1);
    setPlaybackRate(playbackRates[nextIndex]);
    if (playerRef.current) {
      playerRef.current.playbackRate = playbackRates[nextIndex];
    }
  };

  const decreasePlaybackRate = () => {
    const currentIndex = playbackRates.indexOf(playbackRate);
    const prevIndex = Math.max(currentIndex - 1, 0);
    setPlaybackRate(playbackRates[prevIndex]);
    if (playerRef.current) {
      playerRef.current.playbackRate = playbackRates[prevIndex];
    }
  };

  const toggleFullscreen = () => {
    const container = playerRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Format time (e.g., "1:23:45" or "3:45")
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle buffering events
  const handleWaiting = () => setIsBuffering(true);
  const handleCanPlay = () => setIsBuffering(false);
  const handleError = (e: any) => {
    console.error("Video player error:", e);
    setError("Failed to load video. Please try again.");
  };

  if (!playbackId) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg mb-2">No video available</p>
          <p className="text-sm text-gray-400">Click Revalidate to reload</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg mb-2">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group bg-black">
      {/* Main Player */}
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
        poster={thumbnailUrl || THUMBNAIL_FALLBACK}
        autoPlay={autoPlay}
        loop={loop}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}      
        onTimeUpdate={handleTimeUpdate}
        onVolumeChange={handleVolumeChange}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onError={handleError}
        accentColor="#FF2056"
        className={`w-full h-full ${isShort ? "object-contain" : "object-cover"}`}
        // Mux-specific optimizations
        streamType="on-demand"
        preferPlayback="native"
        envKey={process.env.NEXT_PUBLIC_MUX_ENV_KEY}
      />

    
    </div>
  );
};