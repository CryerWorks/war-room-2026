import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";

// POST /api/notes — create a note on a module
export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const body = await request.json();

  const { module_id, content } = body;

  if (!module_id || !content) {
    return NextResponse.json(
      { error: "module_id and content are required" },
      { status: 400 }
    );
  }

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
