import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";

// POST /api/module-tags — assign a tag to a module
// Body: { module_id, tag_id }
export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const body = await request.json();
  const { module_id, tag_id } = body;

  if (!module_id || !tag_id) {
    return NextResponse.json(
      { error: "module_id and tag_id are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("module_tags")
    .insert({ module_id, tag_id })
    .select("*, tag:tags(*)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Tag already assigned" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
