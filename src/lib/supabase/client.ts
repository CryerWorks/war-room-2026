// Browser-side Supabase client.
//
// WHY A SINGLETON HERE (but not server-side):
// In the browser, there's only ever one user — the person looking at the screen.
// The auth session is stored in cookies managed by the browser. Creating
// multiple clients would be wasteful since they'd all read the same cookies.
//
// USED FOR:
// - Auth operations (sign in, sign out, onAuthStateChange)
// - Any future client-side direct Supabase queries
//
// NOT USED FOR:
// - Server components or API routes (use server.ts instead)

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
