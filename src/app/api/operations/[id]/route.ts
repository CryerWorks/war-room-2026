import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";

// GET /api/operations/:id — single operation with full phase/module tree
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;

  const { data, error } = await supabase
    .from("operations")
    .select("*, goal:goals(*, domain:domains(*)), phases(*, modules:modules(*, dependencies:module_dependencies!module_id(id, depends_on_id, depends_on:modules!depends_on_id(id, title, is_completed)), tags:module_tags!module_id(id, tag_id, tag:tags(*))))")
    .eq("id", id)
    .order("sort_order", { referencedTable: "phases" })
    .single();

  if (error) {
    console.error("Operation fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH /api/operations/:id — update an operation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  if (body.status === "completed" && !body.completed_at) {
    body.completed_at = new Date().toISOString();
  }

  body.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("operations")
    .update(body)
    .eq("id", id)
    .select("*, goal:goals(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/operations/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;

  const { error } = await supabase.from("operations").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
