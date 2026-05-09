import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth(function middleware(request) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const isAdminSubdomain = hostname.startsWith("admin.");

  if (!isAdminSubdomain && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/not-found", request.url));
  }

  if (isAdminSubdomain) {
    const isPublicPath =
      pathname.startsWith("/api/auth") || pathname === "/login";

    if (!isPublicPath && !request.auth) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (pathname === "/login" && request.auth) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/login")
    ) {
      if (pathname === "/") {
        return NextResponse.rewrite(new URL("/admin", request.url));
      }
      return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
