import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";

// GET /api/operations?goal_id=xxx&domain_id=xxx&status=active
// Fetch operations with their phases and module counts.
export async function GET(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get("goal_id");
  const domainId = searchParams.get("domain_id");
  const status = searchParams.get("status");

  let query = supabase
    .from("operations")
    .select("*, goal:goals(*), phases(*, modules:modules(id, is_completed, start_time, end_time))")
    .order("sort_order")
    .order("created_at");

  if (goalId) {
    query = query.eq("goal_id", goalId);
  }

  if (domainId) {
    query = query.eq("domain_id", domainId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/operations — create a new operation under a goal
export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const body = await request.json();
  const { goal_id, domain_id, title, description } = body;

  if (!goal_id || !domain_id || !title) {
    return NextResponse.json(
      { error: "goal_id, domain_id, and title are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("operations")
    .insert({
      goal_id,
      domain_id,
      title,
      description: description || "",
      user_id: user!.id,
    })
    .select("*, goal:goals(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
