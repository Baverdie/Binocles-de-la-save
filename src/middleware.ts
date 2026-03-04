import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Check if we're on the admin subdomain (production)
  const isAdminSubdomain = hostname.startsWith("admin.");

  // For admin subdomain: rewrite to /admin/* paths
  if (isAdminSubdomain) {
    // Don't rewrite if already going to /admin or public routes
    if (
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/api/auth") &&
      !pathname.startsWith("/login")
    ) {
      // Rewrite root to /admin
      if (pathname === "/") {
        return NextResponse.rewrite(new URL("/admin", request.url));
      }
      // Rewrite other paths to /admin/*
      return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url));
    }
  }

  // For main domain: block access to /admin/* routes
  if (!isAdminSubdomain && pathname.startsWith("/admin")) {
    // In development, allow direct /admin access
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all paths except static files and API routes (except auth)
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
