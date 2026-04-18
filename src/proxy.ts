// proxy.ts — Next.js 16 route protection.
//
// WHAT THIS DOES:
// Runs before every page render and API call. Checks for a valid
// Supabase auth session in the request cookies. Redirects unauthenticated
// users to /login. Redirects authenticated users away from /login.
//
// WHY PROXY, NOT MIDDLEWARE:
// Next.js 16 renamed middleware.ts to proxy.ts. The function export
// must be named `proxy` (not `middleware`). Same concept, new name.
//
// WHY CHECK AUTH HERE AND IN API ROUTES:
// Defense in depth. The proxy protects pages (user can't even see the UI).
// API route auth protects data (even if someone calls the API directly
// with curl/Postman). Neither alone is sufficient.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  // Create a response we can modify (add/update cookies)
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request cookies (for downstream server components)
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Recreate response with updated request
          supabaseResponse = NextResponse.next({ request });
          // Set cookies on the response (sent back to browser)
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // getUser() validates the JWT server-side (not just reading the token).
  // This is more secure than getSession() which only reads the local token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/login";
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  // Unauthenticated user trying to access protected page → redirect to login
  if (!user && !isLoginPage && !isApiRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated user on login page → redirect to dashboard
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

// Matcher: run proxy on all routes except static assets.
// This regex excludes _next/static, _next/image, favicon, and common image formats.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
