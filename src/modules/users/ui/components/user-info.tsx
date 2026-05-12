import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";


const userInfoVaraint = cva("flex items-center gap-1", {
    variants:{
         size:{
            default: "[&_p]:text-sm [&_svg]:size-4",
            lg:"[&_p]:text-base [&_p]:font-medium [&_p]:text-black [&_svg]:size-5 ",
            sm: "[&_p]:text-xs [&_svg]:size-3.5 ",
         }
    },
    defaultVariants:{
        size: "default"
    }
})


interface UserInfoProps extends VariantProps<typeof userInfoVaraint> {
   name:string;
   className?: string;
  
}


export const UserInfo = ({
 name,
 className,
 size,

}: UserInfoProps) =>{

    return(
        <div className={cn(userInfoVaraint({size, className}))}>
              <Tooltip>
                 <TooltipTrigger asChild>
                        <p className="ml-1 text-muted-foreground line-clamp-1">
                              {name}
                        </p>
                       
                 </TooltipTrigger>
                  <TooltipContent align="end" className="bg-primary">
                                <p>{name}</p>
                        </TooltipContent>
              </Tooltip>

        </div>
    )
} 

