import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { adminRepository } from "@/lib/db/repositories/adminRepository";
import { loginSchema } from "@/lib/validations/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login"
  },
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {}
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const admin = await adminRepository.findByUsername(parsed.data.username);

        if (!admin) {
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, admin.passwordHash);

        if (!valid) {
          return null;
        }

        return {
          id: admin._id.toString(),
          name: admin.username,
          role: admin.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("[next-auth][jwt] incoming token:", token, "user:", user);

      if (user) {
        token.role = typeof user.role === "string" ? user.role.toUpperCase() : "ADMIN";
        token.adminId = user.id;
      }

      console.log("[next-auth][jwt] outgoing token:", token);
      return token;
    },
    async session({ session, token }) {
      console.log("[next-auth][session] before:", session, "token:", token);
      const role = typeof token.role === "string" ? token.role.toUpperCase() : undefined;

      if (!session.user) {
        session.user = {} as typeof session.user;
      }

      session.user.role = role;
      if (token.adminId) {
        session.user.id = token.adminId;
      }

      console.log("[next-auth][session] after:", session);
      return session;
    }
  }
});
