import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/operations/:id — single operation with full phase/module tree
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("operations")
    .select("*, goal:goals(*, domain:domains(*)), phases(*, modules:modules(*))")
    .eq("id", id)
    .order("sort_order", { referencedTable: "phases" })
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH /api/operations/:id — update an operation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { id } = await params;

  const { error } = await supabase.from("operations").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
