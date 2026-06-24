import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { adminRepository } from "@/lib/db/repositories/adminRepository";
import { loginSchema } from "@/lib/validations/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
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
      if (user) {
        token.role = "ADMIN";
        token.adminId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "ADMIN";
        if (token.adminId) {
          session.user.id = token.adminId;
        }
      }
      return session;
    }
  }
});
