import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";
import { createNoteSchema } from "@/lib/schemas";
import { validate } from "@/lib/validation";

// POST /api/notes — create a note on a module
export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const body = await request.json();
  const parsed = validate(createNoteSchema, body);
  if (!parsed.success) return parsed.response;

  const { module_id, content } = parsed.data;

  const { data, error } = await supabase
    .from("module_notes")
    .insert({ module_id, content })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
