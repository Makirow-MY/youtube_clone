import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { UserAvatar } from "@/components/user-avatar";
import { DEFAULT_LIMIT } from "@/constants";
import { commentInsertSchema } from "@/db/schema";
import { useTRPC } from "@/trpc/client";
import { useClerk, useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
// Remove this incorrect import: import { Avatar } from "@radix-ui/react-avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

interface CommentFormProps {
  onSuccess?: () => void;
  videoId: string;
  parentId?: string;
  onCancel?: () => void;
  variant?: "reply" | "comment"
}

export const CommentForm = ({
  videoId,
  parentId,
  onSuccess,
  variant = "comment",
  onCancel
}: CommentFormProps) => {
  const { user } = useUser();
  const trpc = useTRPC();
  const clerk = useClerk();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof commentInsertSchema>>({
    resolver: zodResolver(commentInsertSchema),
    defaultValues: {
      videoId: videoId,
      userId: user  ? user?.id : "",
      parentId: parentId,
      content: "",
    }
  });
 // console.log("current user in comment form", user, form)
  const create = useMutation(
    trpc.comments.create.mutationOptions({
      onSuccess: () => {
        // Invalidate all relevant queries
        queryClient.invalidateQueries({
          queryKey: trpc.comments.getMany.queryKey({ videoId }),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.comments.getMany.queryKey({ videoId, limit: DEFAULT_LIMIT }),
        });

        if (parentId) {
          queryClient.invalidateQueries({
            queryKey: trpc.comments.getMany.queryKey({ videoId, parentId, limit: DEFAULT_LIMIT }),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.comments.getMany.queryKey({ videoId, parentId }),
          });
        }

        toast.success("Comment created successfully");
        form.reset();
        onSuccess?.();
      },
      onError(error) {
        if (error.data?.code === "UNAUTHORIZED") {
          toast.error("You must sign in to create a comment.");
          clerk.openSignIn();
        } else {
          toast.error("An error occurred while creating the comment. Please try again.");
        }
      }
    })
  );

  const handleSubmit = (data: z.infer<typeof commentInsertSchema>) => {
    if (!data.content?.trim()) {
      toast.error("Comment content cannot be empty.");
      return;
    }
    toast.error("Comment content cannot be empty.");

    create.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex gap-4 group">
        <UserAvatar
          size="lg"
          imageUrl={user?.imageUrl || `/avatar.png`}
          name={user?.username || 'User'}
        />

        <div className="flex-1">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <textarea
                    {...field}
                    className={`resize-none w-full ${variant === "reply" ? "px-1.5 py-0.5" : "px-1.5 py-0.5"
                      } bg-secondary overflow-hidden min-h-0`}
                    placeholder={variant === "reply" ? "Reply to this comment..." : "Add a comment..."}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="justify-end gap-2 mt-2 flex">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onCancel?.();
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              disabled={create.isPending}
              type="submit"
              size="sm"
               >
              {variant === "reply" ? "Leave a reply" : "Leave a comment"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}