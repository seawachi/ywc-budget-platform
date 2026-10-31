import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const response = NextResponse.next();

  // Apply Security Headers to all responses
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=()"
  );

  const hasAuthCookie =
    request.cookies.has("camp_auth") ||
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token");

  const isAuthPage = pathname.startsWith("/login");
  const isLogoutIntent = searchParams.has("logout");

  // If visiting /login with logout=1 (or redirected due to invalid session), clear all stale cookies
  if (isAuthPage && isLogoutIntent) {
    response.cookies.delete("camp_auth");
    response.cookies.delete("active_workspace_id");
    response.cookies.delete("better-auth.session_token");
    response.cookies.delete("__Secure-better-auth.session_token");
    response.cookies.delete("better-auth.csrf_token");
    response.cookies.delete("__Secure-better-auth.csrf_token");
    return response;
  }

  // Always allow /login to render (never redirect /login -> / to prevent redirect loops on stale cookies)
  if (isAuthPage) {
    return response;
  }

  // Dashboard routes (/, /treasury, /claims) require authentication
  const isDashboardRoute =
    pathname === "/" ||
    pathname.startsWith("/treasury") ||
    pathname.startsWith("/claims");

  if (!hasAuthCookie && isDashboardRoute) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sample-receipts, etc.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sample-receipts).*)",
  ],
};
