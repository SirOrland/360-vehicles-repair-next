import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isLoggedIn = !!session;
  const role = session?.user?.role;

  if (pathname.startsWith("/admin") && role !== "Admin") {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
  if (pathname.startsWith("/customer") && role !== "Customer") {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
  if (pathname.startsWith("/mechanic") && role !== "Mechanic") {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (
    isLoggedIn &&
    (pathname === "/auth/login" || pathname === "/auth/register")
  ) {
    const dest =
      role === "Admin"
        ? "/admin/dashboard"
        : role === "Mechanic"
          ? "/mechanic/dashboard"
          : "/customer/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/customer/:path*",
    "/mechanic/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
