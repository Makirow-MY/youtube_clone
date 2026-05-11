import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { cache } from 'react';
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { users } from '@/db/schema'
import { auth, currentUser } from "@clerk/nextjs/server"
import { ratelimit } from '@/lib/retelimit';


export const createTRPCContext = cache(async () => {
  const { userId } = await auth();


  return { clerkUserId: userId };
});


export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({

  transformer: superjson,
});


// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;




export const protectedProcedure = t.procedure.use(async function isAuthed(opts) {
  const { ctx, next } = opts;

  if (!ctx.clerkUserId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  let myUser = null;

  const [user] = await db.select()
    .from(users).where(eq(users.clerkId, ctx.clerkUserId)).limit(1)



  if (!user) {
    console.error("No User Found with id", ctx.clerkUserId)
    const clerkUser = await currentUser()
    if (clerkUser) {
      //   throw new TRPCError({ code: 'UNAUTHORIZED' });
      // }

      const firstName = clerkUser.firstName || "";
      const lastName = clerkUser.lastName || "";
      const name = `${firstName} ${lastName}` || "Unknown User";

      const [gotUser] = await db.insert(users).values({
        clerkId: clerkUser.id,
        name: name,
        imageUrl: clerkUser.imageUrl
      }).returning()

      myUser = gotUser;
    }
    else {
      myUser = {
        id: null,
        name: "Unkown User",
        clerkId: "",
        imageUrl: `https://ui-avatars.com/api/?name=Unknown User&background=random`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
  }

  if(user){
  const { success } = await ratelimit.limit(user.id || ctx.clerkUserId);
  if (!success) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  }
  }


  //    if (user) {
  //   window.localStorage.setItem("MyUserId", user.clerkId)
  // }

  return next({
    ctx: {
      ...ctx,
      user: user || myUser
    },
  });
});