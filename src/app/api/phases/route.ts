import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";
import { createPhaseSchema } from "@/lib/schemas";
import { validate } from "@/lib/validation";

// GET /api/phases?operation_id=xxx
// Fetch phases for an operation, ordered by sort_order.
export async function GET(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { searchParams } = new URL(request.url);
  const operationId = searchParams.get("operation_id");

  if (!operationId) {
    return NextResponse.json(
      { error: "operation_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("phases")
    .select("*, modules:modules(id, is_completed, start_time, end_time, title, scheduled_date, deleted_at)")
    .eq("operation_id", operationId)
    .is("deleted_at", null)
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter out soft-deleted modules from nested joins
  const filtered = (data || []).map((phase) => ({
    ...phase,
    modules: (phase.modules || []).filter(
      (m: { deleted_at?: string | null }) => !m.deleted_at
    ),
  }));

  return NextResponse.json(filtered);
}

// POST /api/phases — create a new phase within an operation
export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const body = await request.json();
  const parsed = validate(createPhaseSchema, body);
  if (!parsed.success) return parsed.response;

  const { operation_id, title, description, sort_order } = parsed.data;

  const { data, error } = await supabase
    .from("phases")
    .insert({
      operation_id,
      title,
      description,
      sort_order,
      user_id: user!.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
