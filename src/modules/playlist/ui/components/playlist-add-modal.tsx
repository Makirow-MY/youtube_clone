'use client';

import { ResponsiveModal } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { PlaylistVideoThumnail } from "./playlist-video-thumbnail";
import { PlaylistInfo } from "./playlist-info";
import { Bookmark, Globe2Icon, LockIcon, Plus } from "lucide-react";
import { THUMBNAIL_FALLBACK } from "@/modules/videos/constants";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";

interface PlayListAddModalProps {
  open: boolean;
  videoId: string;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  name: z.string().min(1),
  videoId: z.string(),
  type: z.string(),
});

export const PlayListAddModal = ({
  videoId,
  open,
  onOpenChange,
}: PlayListAddModalProps) => {
  const { isSignedIn } = useAuth();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch playlists
  const playlistQuery = useSuspenseInfiniteQuery(
    trpc.playList.getPlayList.infiniteQueryOptions(
      { limit: DEFAULT_LIMIT },
      { 
        enabled: !!isSignedIn,
        getNextPageParam: (lastPage) => lastPage.nextCursor 
      }
    )
  );

  const playlists = playlistQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const hasPlaylists = playlists.length > 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      videoId: videoId,
      type: "private",
    },
  });

  // Create new playlist + add video
  const createMutation = useMutation(
    trpc.playList.creat.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.playList.getPlayList.queryKey(),
        });
        toast.success("Playlist created successfully");
        form.reset();
        onOpenChange(false);
        setShowCreateForm(false);
      },
      onError: () => toast.error("Something went wrong"),
    })
  );

  // Add video to existing playlist
  const addMutation = useMutation(
    trpc.playList.addPlaylist.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.playList.getPlayList.queryKey(),
        });
        toast.success("Video added to playlist");
        onOpenChange(false);
      },
      onError: () => toast.error("Something went wrong"),
    })
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values);
  };

  return (
    <ResponsiveModal
      title={showCreateForm || !hasPlaylists ? "Create playlist" : "Save to playlist"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col gap-4 py-2">

        {/* SHOW PLAYLIST LIST ONLY IF USER HAS PLAYLISTS AND NOT IN CREATE MODE */}
        {!showCreateForm && hasPlaylists && (
          <div className="flex flex-col gap-2 max-h-[320px] overflow-auto pr-2">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer group"
                onClick={() => {
                  addMutation.mutate({
                    playListId: playlist.id,
                    videoId: videoId,
                  });
                }}
              >
                <div className="flex items-center  gap-4">
                    <PlaylistVideoThumnail
                    imageUrl={playlist.thumbnailUrl || THUMBNAIL_FALLBACK}
                    title={playlist.name}
                    videoCount={playlist.videoCount}
                    className="w-20 h-14"
                  />
                  
                  <PlaylistInfo data={playlist} />
                </div>

                {playlist.videoId === videoId ? <Button size="icon" variant="ghost">
                  <Bookmark className="size-4 fill-black" />
                </Button> : <Button size="icon" variant="ghost">
                  <Bookmark className="size-4" />
                </Button> }
              </div>
            ))}
          </div>
        )}

        {!showCreateForm && hasPlaylists && (
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="mr-2 size-4" />
            Create new playlist
          </Button>
        )}

        {(showCreateForm || !hasPlaylists) && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Playlist name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter playlist name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <LockIcon className="size-4" />
                            Private
                          </div>
                        </SelectItem>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe2Icon className="size-4" />
                            Public
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                {hasPlaylists && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create playlist"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </ResponsiveModal>
  );
};