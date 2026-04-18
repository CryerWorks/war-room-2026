import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";

// POST /api/auth/onboard — create initial data for a new user.
// Called after signup to create user_stats and domain_streaks rows.
// Idempotent — safe to call multiple times (uses upsert pattern).
export async function POST() {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  // Create user_stats row (one per user)
  await supabase
    .from("user_stats")
    .upsert(
      { user_id: user!.id, current_streak: 0, longest_streak: 0 },
      { onConflict: "user_id" }
    );

  // Get all domains to create domain_streaks
  const { data: domains } = await supabase.from("domains").select("id");

  if (domains && domains.length > 0) {
    const streakRows = domains.map((d) => ({
      user_id: user!.id,
      domain_id: d.id,
      current_streak: 0,
      longest_streak: 0,
    }));

    // Upsert to avoid duplicates if called multiple times
    await supabase
      .from("domain_streaks")
      .upsert(streakRows, { onConflict: "user_id,domain_id" });
  }

  return NextResponse.json({ onboarded: true });
}
