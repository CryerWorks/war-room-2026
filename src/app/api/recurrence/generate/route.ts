import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";
import { generateRecurringModules } from "@/lib/recurrence";

// POST /api/recurrence/generate — trigger generation for all active rules.
// Called on dashboard load to keep the rolling 4-week window current.
// Idempotent — safe to call multiple times, won't create duplicates.
export async function POST() {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  try {
    const created = await generateRecurringModules(supabase);
    return NextResponse.json({ generated: created });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
