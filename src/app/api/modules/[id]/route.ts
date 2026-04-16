import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// PATCH /api/modules/:id — update a module (edit fields or toggle completion)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // If toggling completion, set completed_at timestamp
  if ("is_completed" in body) {
    body.completed_at = body.is_completed ? new Date().toISOString() : null;
  }

  body.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("modules")
    .update(body)
    .eq("id", id)
    .select("*, domain:domains(*), notes:module_notes(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/modules/:id — delete a module
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase.from("modules").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
