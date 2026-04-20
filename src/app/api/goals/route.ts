import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";
import { createGoalSchema } from "@/lib/schemas";
import { validate } from "@/lib/validation";

// GET /api/goals?domain_id=xxx&status=active
// Fetch goals for a domain, optionally filtered by status.
// Returns goals with their operations and nested phases.
export async function GET(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get("domain_id");
  const status = searchParams.get("status");

  let query = supabase
    .from("goals")
    .select("*, domain:domains(*), operations(*, phases(*, modules:modules(id, is_completed, start_time, end_time, deleted_at)))")
    .is("deleted_at", null)
    .order("sort_order")
    .order("created_at");

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

  // Filter out soft-deleted children from nested joins
  const filtered = (data || []).map((goal) => ({
    ...goal,
    operations: (goal.operations || [])
      .filter((op: { deleted_at?: string | null }) => !op.deleted_at)
      .map((op: { phases?: Array<{ deleted_at?: string | null; modules?: Array<{ deleted_at?: string | null }> }> }) => ({
        ...op,
        phases: (op.phases || [])
          .filter((p) => !p.deleted_at)
          .map((p) => ({
            ...p,
            modules: (p.modules || []).filter((m) => !m.deleted_at),
          })),
      })),
  }));

  return NextResponse.json(filtered);
}

// POST /api/goals — create a new goal
export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const body = await request.json();
  const parsed = validate(createGoalSchema, body);
  if (!parsed.success) return parsed.response;

  const { domain_id, title, description, icon, target_date, theatre_id } = parsed.data;

  const { data, error } = await supabase
    .from("goals")
    .insert({
      domain_id,
      title,
      description,
      icon: icon || null,
      target_date: target_date || null,
      theatre_id: theatre_id || null,
      user_id: user!.id,
    })
    .select("*, domain:domains(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
