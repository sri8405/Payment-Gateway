import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role =
    typeof session?.user?.role === "string"
      ? session.user.role.toUpperCase()
      : undefined;

  console.log("[middleware] path:", pathname);
  console.log("[middleware] token present:", !!session, "role:", role);
  console.log("[middleware] req.auth:", JSON.stringify(session));
  console.log("[middleware] Cookies:", JSON.stringify(req.cookies.getAll()));

  // Protected admin routes — require ADMIN role
  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    role !== "ADMIN"
  ) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  // Already authenticated admin visiting login page — send to dashboard
  if (pathname === "/admin/login" && role === "ADMIN") {
    const dashboardUrl = new URL("/admin/dashboard", req.nextUrl.origin);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
