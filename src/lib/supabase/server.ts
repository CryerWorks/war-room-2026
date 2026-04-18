// Server-side Supabase client factory.
//
// WHY A FACTORY, NOT A SINGLETON:
// Each server request needs its own Supabase client because each client
// reads cookies from the current request to determine the authenticated user.
// A singleton would share state between requests — user A's session would
// leak into user B's queries. The factory creates a fresh client per request.
//
// HOW IT WORKS:
// 1. `cookies()` from next/headers gives us the current request's cookie jar
// 2. We pass cookie read/write functions to `createServerClient`
// 3. Supabase reads the auth token from cookies automatically
// 4. All queries through this client are scoped to the authenticated user via RLS
//
// USED IN: Server components (page.tsx), API routes, server-side lib functions

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can fail in Server Components because they're read-only.
            // This is expected — the proxy handles cookie refresh.
            // It only matters in Route Handlers where we can write cookies.
          }
        },
      },
    }
  );
}
