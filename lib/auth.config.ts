import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible NextAuth configuration.
 *
 * This file contains ONLY the options that are safe to run in Edge Runtime
 * (middleware). It must NOT import mongoose, bcrypt, or any Node.js-only module.
 *
 * The full auth configuration (with Credentials provider + DB) is in auth.ts,
 * which spreads this config and adds providers.
 */
export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/admin/login",
  },
  providers: [], // Providers are added in auth.ts (Node.js runtime only)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role =
          typeof user.role === "string" ? user.role.toUpperCase() : "ADMIN";
        token.adminId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      const role =
        typeof token.role === "string" ? token.role.toUpperCase() : undefined;

      if (!session.user) {
        session.user = {} as typeof session.user;
      }

      session.user.role = role;
      if (token.adminId) {
        session.user.id = token.adminId as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
