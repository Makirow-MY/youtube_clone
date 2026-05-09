import { DEFAULT_LIMIT } from "@/constants";
import { comments } from "@/db/schema";
import { useTRPC } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";



interface SuscriptionButtonProps{
   userId: string;
   isSubscribed: boolean;
   fromVideoId?: string;
}


export const useSubscription = ({userId, isSubscribed, fromVideoId}: SuscriptionButtonProps) => {
const trpc = useTRPC();
    const clerk = useClerk();
   const queryClient = useQueryClient();

    const subscribe = useMutation(
         trpc.subscription.create.mutationOptions({
           onSuccess: () => {

             queryClient.invalidateQueries({
               queryKey: trpc.videos.getManySubscribed.queryKey({ limit: DEFAULT_LIMIT }),
             });
            if(fromVideoId) {
                 queryClient.invalidateQueries({
               queryKey: trpc.videos.getOne.queryKey({id: fromVideoId}),
             });
              
            }
             
             toast.success("Subscribed successfully")
            
           },
             onError(error) {
            if(error.data?.code === "UNAUTHORIZED") {
                clerk.openSignIn()
                toast.error("You must sign in to subscribe.")
            }
            else{
                 toast.error("An error occurred while processing your subscription. Please try again.")
           
            }
        }
         })
       ); 
     
     const unSubscribe = useMutation(
         trpc.subscription.remove.mutationOptions({
           onSuccess: () => {

             queryClient.invalidateQueries({
               queryKey: trpc.videos.getManySubscribed.queryKey({ limit: DEFAULT_LIMIT }),
             });
            if(fromVideoId) {
                 queryClient.invalidateQueries({
               queryKey: trpc.videos.getOne.queryKey({id: fromVideoId}),
             });
              
            }
             
             toast.success("Unsubscribed successfully")
            
           },
              onError(error) {
            if(error.data?.code === "UNAUTHORIZED") {
                clerk.openSignIn()
                toast.error("You must sign in to unsubscribe.")
            }
             else{
                 toast.error("An error occurred while processing your subscription. Please try again.")
            }
        }
         })
       ); 
   
    const isPending = subscribe.isPending || unSubscribe.isPending;

    const OnClick = () => {
        if(isSubscribed) {
            unSubscribe.mutate({userId})
            queryClient.invalidateQueries({
               queryKey: trpc.videos.getManySubscribed.queryKey({ limit: DEFAULT_LIMIT }),
             });
                     
        } else {
            subscribe.mutate({userId})
            queryClient.invalidateQueries({
               queryKey: trpc.videos.getManySubscribed.queryKey({ limit: DEFAULT_LIMIT }),
             });
          
        }
    }


    return {
        OnClick,
        isPending
    }

}


