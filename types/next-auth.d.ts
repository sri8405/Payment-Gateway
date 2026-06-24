import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "ADMIN";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    adminId?: string;
    role?: "ADMIN";
  }
}
