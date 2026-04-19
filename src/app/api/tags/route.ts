import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";
import { createTagSchema } from "@/lib/schemas";
import { validate } from "@/lib/validation";

// GET /api/tags — list all tags
export async function GET() {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/tags — create a new tag
export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const body = await request.json();
  const parsed = validate(createTagSchema, body);
  if (!parsed.success) return parsed.response;

  const { name, color } = parsed.data;

  const { data, error } = await supabase
    .from("tags")
    .insert({ name: name.trim().toLowerCase(), color: color || "#71717a" })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
