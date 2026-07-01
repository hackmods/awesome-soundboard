import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const protectedPaths = ["/dashboard", "/boards", "/settings"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === "/login" || pathname === "/register") && req.auth) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/boards/:path*", "/settings/:path*", "/login", "/register"],
};
