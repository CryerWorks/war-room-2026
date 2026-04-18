// auth.ts — authentication helpers for API routes.
//
// PATTERN: Every API route calls getAuthenticatedUser() at the top.
// If the user isn't authenticated, return unauthorized() immediately.
// If they are, use the returned supabase client (which is scoped to
// that user's session) for all database operations.
//
// WHY NOT JUST CHECK IN THE PROXY?
// The proxy protects pages but not API routes called directly (e.g.,
// someone using curl or Postman). API routes need their own auth check.
// This is "defense in depth" — multiple layers of protection.

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

interface AuthResult {
  user: User | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
  error: string | null;
}

/**
 * Extract the authenticated user from the current request.
 * Returns the user, an authenticated Supabase client, and any error.
 *
 * Usage in API routes:
 * ```
 * const { user, supabase, error } = await getAuthenticatedUser();
 * if (error) return unauthorized();
 * // ... use supabase (scoped to this user) ...
 * ```
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, supabase, error: "Unauthorized" };
  }

  return { user, supabase, error: null };
}

/**
 * Standard 401 response for unauthenticated API requests.
 */
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
