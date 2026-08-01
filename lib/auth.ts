import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { adminRepository } from "@/lib/db/repositories/adminRepository";
import { loginSchema } from "@/lib/validations/auth";
import { authConfig } from "./auth.config";
import { enforceRateLimit } from "@/lib/rateLimit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const rateLimitResponse = await enforceRateLimit(request as any, "admin:login");
        if (rateLimitResponse) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        const admin = await adminRepository.findByUsername(
          parsed.data.username
        );

        if (!admin) {
          return null;
        }

        const valid = await bcrypt.compare(
          parsed.data.password,
          admin.passwordHash
        );

        if (!valid) {
          return null;
        }

        return {
          id: admin._id.toString(),
          name: admin.username,
          role: admin.role,
        };
      },
    }),
  ],
});
