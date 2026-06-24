import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const role = typeof token?.role === "string" ? token.role.toUpperCase() : undefined;

  console.log("[middleware] path:", pathname, "token present:", !!token, "role:", role);

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && role !== "ADMIN") {
    const loginUrl = new URL("/admin/login", request.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/admin/login" && role === "ADMIN") {
    const dashboardUrl = new URL("/admin/dashboard", request.nextUrl.origin);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
