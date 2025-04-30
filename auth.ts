import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import Loops from "next-auth/providers/loops";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub,
    Google,
    // @ts-ignore
    Loops({
      apiKey: process.env.AUTH_LOOPS_KEY,
      transactionalId: process.env.AUTH_LOOPS_TRANSACTIONAL_ID,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL || "",
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  }),
  pages: {
    signIn: "/login",
  },
})
