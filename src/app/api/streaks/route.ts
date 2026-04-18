import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";

// GET /api/streaks — global and per-domain streak data
export async function GET() {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const [globalResult, domainResult] = await Promise.all([
    supabase.from("user_stats").select("*").single(),
    supabase
      .from("domain_streaks")
      .select("*, domain:domains(name, slug, color)")
      .order("domain_id"),
  ]);

  if (globalResult.error) {
    return NextResponse.json(
      { error: globalResult.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    global: globalResult.data,
    domains: domainResult.data || [],
  });
}
