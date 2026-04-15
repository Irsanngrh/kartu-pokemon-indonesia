import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      const adminEmails = (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);

      if (account && profile?.email) {
        const isEnvAdmin = adminEmails.includes(profile.email.toLowerCase());

        const { data } = await supabaseAdmin
          .from("users")
          .upsert(
            {
              email: profile.email,
              name: (profile as { name?: string }).name ?? null,
              image: (profile as { picture?: string }).picture ?? null,
              ...(isEnvAdmin ? { is_admin: true } : {}),
            },
            { onConflict: "email" }
          )
          .select("id, is_admin")
          .single();

        if (data) {
          token.userId = data.id as string;
          token.isAdmin = isEnvAdmin || (data.is_admin as boolean);
        }
      } else if (token.userId) {
        // Re-read is_admin on subsequent requests so DB changes take effect immediately.
        const { data } = await supabaseAdmin
          .from("users")
          .select("email, is_admin")
          .eq("id", token.userId)
          .single();

        if (data) {
          const isEnvAdmin = adminEmails.includes((data.email ?? '').toLowerCase());
          token.isAdmin = isEnvAdmin || (data.is_admin as boolean);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = (token.userId as string) ?? "";
      session.user.isAdmin = (token.isAdmin as boolean) ?? false;
      return session;
    },
  },
});
