import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  
  // Enforce single production domain
  const host = req.headers.get("host") || "";
  if (host.includes("guruseva.vercel.app")) {
    const targetUrl = new URL(pathname + req.nextUrl.search, "https://guru-seva.me");
    return NextResponse.redirect(targetUrl, 301);
  }

  const session = req.auth;
  const role =
    typeof session?.user?.role === "string"
      ? session.user.role.toUpperCase()
      : undefined;

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

  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|assets|sw.js|workbox-).*)"],
};
