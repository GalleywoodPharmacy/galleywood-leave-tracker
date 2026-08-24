import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Manager-only pages: is_manager is checked server-side here (spec section 3:
// "checked server-side, not just client-side"), never trusted from the client.
const MANAGER_ONLY_PREFIXES = ["/team", "/settings"];

// Everything under these prefixes requires a signed-in user.
const PROTECTED_PREFIXES = ["/dashboard", "/leave", "/calendar", "/coverage", "/team", "/settings"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isManagerOnly = MANAGER_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  if (isManagerOnly && !token.isManager) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/leave/:path*", "/calendar/:path*", "/coverage/:path*", "/team/:path*", "/settings/:path*"],
};
