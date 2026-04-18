import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";
import { runCompletionCascade } from "@/lib/streaks";

// PATCH /api/modules/:id — update a module (edit fields or toggle completion)
// When a module is completed, runs the cascade check:
//   module → phase → operation → goal
// Returns the updated module plus any CompletionEvents for overlay display.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  const justCompleted = body.is_completed === true;

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

  // Run completion cascade if the module was just marked complete
  let completions: unknown[] = [];
  if (justCompleted && data) {
    completions = await runCompletionCascade(
      supabase,
      data.phase_id,
      data.operation_id,
      data.domain_id
    );
  }

  return NextResponse.json({ ...data, completions });
}

// DELETE /api/modules/:id — delete a module
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;

  const { error } = await supabase.from("modules").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
