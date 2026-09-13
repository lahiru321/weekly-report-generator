import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "access_token";
const PUBLIC_ROUTES = ["/login", "/register"];

// Optimistic check only: redirects based on whether the auth cookie exists.
// Real permission checks always happen in the Spring Boot API.
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const hasSession = req.cookies.has(AUTH_COOKIE);

  if (!isPublicRoute && !hasSession) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (isPublicRoute && hasSession) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico)$).*)"],
};
