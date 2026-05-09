
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";


interface SuscriptionButtonProps{
   onClick:ButtonProps["onClick"];
   disabled: boolean;
   isSubscribed:boolean;
   className?: string;
   size?: ButtonProps["size"]
}


export const SubscriptionButton = ({onClick,
    disabled, isSubscribed, className, size
}: SuscriptionButtonProps) => {
  
    return (
    <Button
    size={size}
    onClick={onClick}
    disabled={disabled}
    className={cn("rounded-full", className)}
    variant={isSubscribed ? "secondary" : "default"}
    >
        {isSubscribed ? "Unsubscribe" : "Subscribe"}
    </Button>
  );
}