import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub, Google],
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL || "",
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  }),
  pages: {
    signIn: "/login",
  },
})
