'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { APP_URL, DEFAULT_LIMIT } from '@/constants';
import { PlayListAddModal } from '@/modules/playlist/ui/components/playlist-add-modal';
import { useTRPC } from '@/trpc/client';
import { useAuth, useClerk } from '@clerk/nextjs';
import { useMutation, useQueryClient, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import {
  BookmarkCheckIcon,
  BookMarked,
  BookmarkIcon,
  BubblesIcon,
  Copy,
  DownloadIcon,
 // Facebook,
  FlagIcon,
  ListPlusIcon,
  Mail,
  MailIcon,
  MailsIcon,
  MoreVerticalIcon,
  SaveIcon,
  Share2Icon,
  Trash2Icon,
 // Twitter,
 // TwitterIcon,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { VideoGetManyOutput } from '../../types';
import { 
  FaFacebookF, 
  FaTwitter, 
  FaInstagram, 
  FaWhatsapp, 
  FaLinkedinIn 
} from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";

interface VideoMenuProps {
  videoId: string;
  data?: VideoGetManyOutput["items"][number];
  variant?: 'ghost' | 'secondary';
  onRemove?: () => void;
}

const WhatsAppIcon = () => (
  <svg width="1100px" height="1100px" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M16 31C23.732 31 30 24.732 30 17C30 9.26801 23.732 3 16 3C8.26801 3 2 9.26801 2 17C2 19.5109 2.661 21.8674 3.81847 23.905L2 31L9.31486 29.3038C11.3014 30.3854 13.5789 31 16 31ZM16 28.8462C22.5425 28.8462 27.8462 23.5425 27.8462 17C27.8462 10.4576 22.5425 5.15385 16 5.15385C9.45755 5.15385 4.15385 10.4576 4.15385 17C4.15385 19.5261 4.9445 21.8675 6.29184 23.7902L5.23077 27.7692L9.27993 26.7569C11.1894 28.0746 13.5046 28.8462 16 28.8462Z" fill="#BFC8D0" />
    <path d="M28 16C28 22.6274 22.6274 28 16 28C13.4722 28 11.1269 27.2184 9.19266 25.8837L5.09091 26.9091L6.16576 22.8784C4.80092 20.9307 4 18.5589 4 16C4 9.37258 9.37258 4 16 4C22.6274 4 28 9.37258 28 16Z" fill="url(#paint0_linear_87_7264)" />
    <path fill-rule="evenodd" clip-rule="evenodd" d="M16 30C23.732 30 30 23.732 30 16C30 8.26801 23.732 2 16 2C8.26801 2 2 8.26801 2 16C2 18.5109 2.661 20.8674 3.81847 22.905L2 30L9.31486 28.3038C11.3014 29.3854 13.5789 30 16 30ZM16 27.8462C22.5425 27.8462 27.8462 22.5425 27.8462 16C27.8462 9.45755 22.5425 4.15385 16 4.15385C9.45755 4.15385 4.15385 9.45755 4.15385 16C4.15385 18.5261 4.9445 20.8675 6.29184 22.7902L5.23077 26.7692L9.27993 25.7569C11.1894 27.0746 13.5046 27.8462 16 27.8462Z" fill="white" />
    <path d="M12.5 9.49989C12.1672 8.83131 11.6565 8.8905 11.1407 8.8905C10.2188 8.8905 8.78125 9.99478 8.78125 12.05C8.78125 13.7343 9.52345 15.578 12.0244 18.3361C14.438 20.9979 17.6094 22.3748 20.2422 22.3279C22.875 22.2811 23.4167 20.0154 23.4167 19.2503C23.4167 18.9112 23.2062 18.742 23.0613 18.696C22.1641 18.2654 20.5093 17.4631 20.1328 17.3124C19.7563 17.1617 19.5597 17.3656 19.4375 17.4765C19.0961 17.8018 18.4193 18.7608 18.1875 18.9765C17.9558 19.1922 17.6103 19.083 17.4665 19.0015C16.9374 18.7892 15.5029 18.1511 14.3595 17.0426C12.9453 15.6718 12.8623 15.2001 12.5959 14.7803C12.3828 14.4444 12.5392 14.2384 12.6172 14.1483C12.9219 13.7968 13.3426 13.254 13.5313 12.9843C13.7199 12.7145 13.5702 12.305 13.4803 12.05C13.0938 10.953 12.7663 10.0347 12.5 9.49989Z" fill="white" />
    <defs>
      <linearGradient id="paint0_linear_87_7264" x1="26.5" y1="7" x2="4" y2="28" gradientUnits="userSpaceOnUse">
        <stop stop-color="#5BD066" />
        <stop offset="1" stop-color="#27B43E" />
      </linearGradient>
    </defs>
  </svg>
);

export default function VideoMenu({ data, videoId, variant, onRemove }: VideoMenuProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const clerk = useClerk();
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [embedSize, setEmbedSize] = useState({ width: 560, height: 315 });
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [reportDet, setReportDets] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
 //const UserId =  window.localStorage.getItem("MyUserId")
  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/videos/${videoId}`
    : `${APP_URL}/videos/${videoId}`;

  const sizes = [
    { label: 'Standard (560×315)', width: 560, height: 315 },
    { label: 'Medium (640×360)', width: 640, height: 360 },
    { label: 'Large (1280×720)', width: 1280, height: 720 },
  ];

  const embedCode = `<iframe width="${embedSize.width}" height="${embedSize.height}" src="${fullUrl}" title="Video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;

  const socialOptions = [
    {
      name: 'Facebook',
      icon: FaFacebookF,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    },
    {
      name: 'Twitter',
      icon: FaTwitter,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}`,
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(fullUrl)}`,
    },
    {
      name: 'Email',
      icon: MailsIcon,
      url: `mailto:?subject=Check out this video&body=${encodeURIComponent(fullUrl)}`,
    },
  ];

  const downloadQualities = [
    { label: '360p', size: '~35 MB', format: 'MP4' },
    { label: '480p', size: '~65 MB', format: 'MP4' },
    { label: '720p', size: '~130 MB', format: 'MP4' },
    { label: '1080p', size: '~280 MB', format: 'MP4' },
  ];

  const reportReasons = [
    'Spam or misleading',
    'Hate speech or harassment',
    'Sexual content',
    'Violent or graphic content',
    'Child abuse',
    'Copyright infringement',
    'Other',
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      toast.success('Link copied to clipboard');
    });
  };


  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      toast.success('Embed code copied to clipboard');
    });
  };
  const playlistQuery = useSuspenseInfiniteQuery(
    trpc.playList.getPlayList.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    )
  );

  const downloadVideo = async (videoId: string, downloadUrl: string) => {
    setIsDownloading(true);
    setProgress(0);
    try {
      await downloadWithProgress(downloadUrl, videoId);

      toast.success('Download started!');
    }
    catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  }

//   const downloadWithProgress = async (url: string, filename: string) => {
//     const response = await fetch(url);

//     if (!response.ok) throw new Error('Download failed');
//     const contentLength = response.headers.get('content-length');
//     const total = contentLength ? parseInt(contentLength, 10) : 0;
//     let loaded = 0;

//     const reader = response.body?.getReader();
//     const chunks: Uint8Array[] = []; 
//  if (!reader) throw new Error('Cannot read response');

//     while (true){
//       const { done, value } = await reader.read();
//       if (done) break;
      
//       chunks.push(value);
//       loaded += value.length;
      
//       if (total) {
//         setProgress(Math.round((loaded / total) * 100));
//       }
//     }

//      const blob = new Blob(chunks, { type: 'video/mp4' });
//     const downloadUrl = URL.createObjectURL(blob);
    
//     // Trigger download
//     const a = document.createElement('a');
//     a.href = downloadUrl;
//     a.download = `${filename}.mp4`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);

//     // Cleanup
//     URL.revokeObjectURL(downloadUrl);
//   }


const downloadWithProgress = async (url: string, filename: string) => {
  const response = await fetch(url);
  
  if (!response.ok) throw new Error('Download failed');
  
  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let loaded = 0;

  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];

  if (!reader) throw new Error('Cannot read response');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    if (value) {
      chunks.push(value);
      loaded += value.length;
      
      if (total) {
        setProgress(Math.round((loaded / total) * 100));
      }
    }
  }

  // Combine chunks into a single Uint8Array
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const combinedArray = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    combinedArray.set(chunk, offset);
    offset += chunk.length;
  }
  
  // Create blob from combined array
  const blob = new Blob([combinedArray], { type: 'video/mp4' });
  const downloadUrl = URL.createObjectURL(blob);
  
  // Trigger download
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download =  filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Cleanup
  URL.revokeObjectURL(downloadUrl);
};

  const playlists = playlistQuery.data?.pages.flatMap((page) => page.items) ?? [];
  // Watch Later playlist ID
  const watchLaterPlaylist = playlists.find(
    (p) => p.name === "Watch Later" && p.videoVisibility === "private"
  );

  const isInWatchLater = playlists.some(
    (p) => p.id === watchLaterPlaylist?.id && p.videoId === videoId
  );

  // ====================== MUTATIONS ======================
  const Create = useMutation(
    trpc.playList.creat.mutationOptions({
      onSuccess: async () => {
        // ✅ THIS IS THE FIX
        queryClient.invalidateQueries({
          queryKey: trpc.playList.getPlayList.queryKey(), // partial key = most reliable
        });
        await queryClient.refetchQueries({
          queryKey: trpc.playList.getPlayList.queryKey({ limit: DEFAULT_LIMIT }),
        });
        toast.success("Added to Watch Later");
      },
      onError: () => toast.error("Something went wrong"),
    })
  );

  const AddPlaylist = useMutation(
    trpc.playList.addPlaylist.mutationOptions({
      onSuccess: async (data) => {
        console.log("Add to playlist response:", data);
        queryClient.invalidateQueries({
          queryKey: trpc.playList.getPlayList.queryKey(), // partial key = most reliable
        });
        await queryClient.refetchQueries({
          queryKey: trpc.playList.getPlayList.queryKey({ limit: DEFAULT_LIMIT }),
        });
        toast.success(isInWatchLater ? "Removed from Watch Later" : "Added to Watch Later");
      },
      onError: () => toast.error("Something went wrong"),
    })
  );

  // ====================== HANDLERS ======================
  const handleWatchLater = () => {
    const myUserId =  window.localStorage.getItem("MyUserId")

    if (!watchLaterPlaylist) {
      // Create Watch Later playlist + add video
      Create.mutate({
        name: "Watch Later",
        videoId,
        type: "private",
        myUserId,
      });
    } else {
      // Add or remove from existing Watch Later
      AddPlaylist.mutate({
        playListId: watchLaterPlaylist.id,
        videoId,
        myUserId,
      });
    }
  };

  const handleReportSubmit = () => {
    if (!selectedReportReason) return;
    console.log('Report submitted:', { videoId, reason: selectedReportReason, details: reportDetails });

    toast.success('Thank you! Your report has been submitted.');
    setIsReportOpen(false);
    setSelectedReportReason(null);
    setReportDetails('');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" className="rounded-full">
            <MoreVerticalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>

          <DropdownMenuItem
            onClick={() => setIsShareOpen(true)}
            className="cursor-pointer"
          >
            <Share2Icon className="mr-2 size-4" />
            Share
          </DropdownMenuItem>

          {(isSignedIn //|| UserId

          ) &&

            <>

              <DropdownMenuItem onClick={() => setIsDownloadOpen(true)} className="cursor-pointer">
                <DownloadIcon className="mr-2 size-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleWatchLater} className="cursor-pointer">
                <BookmarkIcon className={`mr-2 size-4 ${isInWatchLater ? 'fill-black' : ''}`} />
                {isInWatchLater ? 'Remove from watch later' : 'Save to watch later'}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setIsPlaylistOpen(true)} className="cursor-pointer">
                <ListPlusIcon className="mr-2 size-4" />
                Add to playlist
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setIsReportOpen(true)} className="cursor-pointer">
                <FlagIcon className="mr-2 size-4" />
                Report
              </DropdownMenuItem>

            </>}

          {onRemove && (
            <DropdownMenuItem onClick={onRemove} className="cursor-pointer text-destructive focus:text-destructive">
              <Trash2Icon className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* FULL YOUTUBE-STYLE SHARE DIALOG */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Share this video</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Share privately with friends or embed it on your website
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-2">
            {/* 1. SOCIAL SHARING BUTTONS (exactly like YouTube) */}
            <div>
              <Label className="text-sm font-medium tracking-tight">Share via</Label>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {socialOptions.map((social) => {
                  const Icon = social.icon;
                  return (
                    <Button
                      key={social.name}
                      variant="outline"
                      className="h-20 flex flex-col items-center gap-2 border rounded-xl hover:border-primary"
                      onClick={() => {
                        window.open(social.url, '_blank', 'noopener,noreferrer');
                      }}
                    >

                      <Button variant={"outline"} size={"icon"}
                        className={`rounded-full  hover:bg-none ${social.name === 'Facebook' && 'bg-blue-600 border-blue-600 hover:bg-blue-600'}
                     ${social.name === 'Twitter' && 'bg-sky-500 border-sky-500 hover:bg-sky-500'}
                     ${social.name === 'WhatsApp' && 'bg-green-500 border-green-500 hover:bg-green-500'}
                     ${social.name === 'Email' && 'bg-red-500 border-red-500 hover:bg-red-500'} `}
                      >
                        <Icon className="size-9 fill-white text-white font-bold " />
                      </Button>
                      <span className="text-xs font-medium">{social.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* 2. COPY LINK SECTION */}
            <div className="space-y-2">
              <Label className="text-sm font-medium tracking-tight">Copy link</Label>
              <div className="flex">
                <Input
                  value={fullUrl}
                  readOnly
                  className="rounded-r-none font-mono text-sm bg-muted/50"
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  className="rounded-l-none px-6"
                >
                  <Copy className="mr-2 size-4" />
                  Copy
                </Button>
              </div>
            </div>

            {/* 3. EMBED SECTION – full YouTube style */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium tracking-tight">Embed</Label>

                {/* Size selector */}
                <Select
                  value={`${embedSize.width}×${embedSize.height}`}
                  onValueChange={(value) => {
                    const selected = sizes.find(
                      (s) => `${s.width}×${s.height}` === value
                    );
                    if (selected) setEmbedSize({ width: selected.width, height: selected.height });
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizes.map((size) => (
                      <SelectItem key={size.label} value={`${size.width}×${size.height}`}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Embed code */}
              <Textarea
                value={embedCode}
                readOnly
                rows={5}
                className="font-mono text-xs resize-none bg-muted/50"
              />

              <Button onClick={handleCopyEmbed} className="w-full sm:w-auto">
                <Copy className="mr-2 size-4" />
                Copy embed code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Report this video</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Help us understand what&apos;s wrong
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 h-[250px] overflow-y-scroll py-4">
            <Label className="text-sm font-medium">Why are you reporting this?</Label>

            <div className="space-y-1 ">
              {reportReasons.map((reason) => (
                <div
                  key={reason}
                  onClick={() => setSelectedReportReason(reason)}
                  className={`flex items-center justify-between px-4 py-3 border rounded-lg cursor-pointer transition-all ${selectedReportReason === reason
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted'
                    }`}
                >
                  <span className="text-sm">{reason}</span>
                  {selectedReportReason === reason && (
                    <span className="text-primary text-xl leading-none">✓</span>
                  )}
                </div>
              ))}
            </div>

            {selectedReportReason === "Other" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Additional details (optional)</Label>
                <Textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Tell us more..."
                  rows={3}
                />
              </div>)}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReportSubmit}
              disabled={!selectedReportReason}
            >
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
        <DialogContent className="max-w-md">
         <DialogHeader>
            <DialogTitle className="text-xl">Download video</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isDownloading 
                ? `Downloading... ${progress}%` 
                : 'Choose quality • Video will download directly from the source'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 h-[250px] overflow-y-scroll py-4">
            {downloadQualities.map((quality) => (
              <Button
                key={quality.label}
                variant="outline"
                className="w-full justify-between h-auto py-6 px-6"
                onClick={() => {
                  if (data?.downloadUrl) {
                    downloadVideo(data.downloadUrl, data?.title || 'video');
                  }
                }}
              >
                <div className="text-left">
                  <div className="font-semibold text-lg">{quality.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {quality.format} • {quality.size}
                  </div>
                </div>
                <DownloadIcon className="size-5" />
              </Button>
            ))}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDownloadOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PlayListAddModal videoId={videoId} open={isPlaylistOpen} onOpenChange={setIsPlaylistOpen} />

    </>
  );
}