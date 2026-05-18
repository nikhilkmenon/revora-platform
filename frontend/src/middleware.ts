/**
 * Next.js Edge Middleware — server-side route protection.
 * Runs before any page renders. Checks for the auth token cookie
 * and redirects unauthenticated users to /login.
 *
 * NOTE: Deep role validation (BUYER vs DESIGNER vs ADMIN) happens
 * client-side in ProtectedRoute.tsx because JWTs are in localStorage,
 * not in HttpOnly cookies. Middleware provides a first-pass redirect only.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/designer",
  "/admin",
  "/orders",
];

// Routes only for unauthenticated users
const AUTH_ONLY_ROUTES = ["/login"];

// Token cookie name (mirrors the localStorage key used client-side)
const TOKEN_KEY = "revora_token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read token from cookie (set by layout on first load for SSR awareness)
  const tokenCookie = request.cookies.get(TOKEN_KEY)?.value;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthOnly = AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r));

  // Unauthenticated user trying to access a protected route
  if (isProtected && !tokenCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to go to /login — redirect to shop
  if (isAuthOnly && tokenCookie) {
    return NextResponse.redirect(new URL("/shop", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)).*)",
  ],
};
