import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";

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
    .select("*, modules:modules(id, is_completed, start_time, end_time, title, scheduled_date)")
    .eq("operation_id", operationId)
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/phases — create a new phase within an operation
export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const body = await request.json();
  const { operation_id, title, description, sort_order } = body;

  if (!operation_id || !title) {
    return NextResponse.json(
      { error: "operation_id and title are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("phases")
    .insert({
      operation_id,
      title,
      description: description || "",
      sort_order: sort_order ?? 0,
      user_id: user!.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
