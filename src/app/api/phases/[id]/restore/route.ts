import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";

// POST /api/phases/:id/restore — undo a soft delete.
// Restores the phase and any modules that were cascade-deleted
// at the same timestamp.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;
  const body = await request.json();
  const { deleted_at } = body;

  if (!deleted_at) {
    return NextResponse.json(
      { error: "deleted_at timestamp is required" },
      { status: 400 }
    );
  }

  // Restore the phase
  const { error } = await supabase
    .from("phases")
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("deleted_at", deleted_at);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Restore cascade-deleted modules under this phase
  await supabase
    .from("modules")
    .update({ deleted_at: null })
    .eq("phase_id", id)
    .eq("deleted_at", deleted_at);

  return NextResponse.json({ restored: true });
}
