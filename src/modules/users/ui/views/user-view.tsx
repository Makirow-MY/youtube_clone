import { UserSection } from "../sections/user-section";

interface PagePops{
    userId: string;
}

export const UserView = async({userId}: PagePops) => {
    return(
        <div>
            <UserSection userId={userId}/>
          
        </div>    
    )
}