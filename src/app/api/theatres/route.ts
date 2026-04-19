import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";
import { createTheatreSchema } from "@/lib/schemas";
import { validate } from "@/lib/validation";

// GET /api/theatres — list all theatres with their goals
export async function GET() {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { data, error } = await supabase
    .from("theatres")
    .select("*, goals(*, domain:domains(name, slug, color), operations(id, status))")
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/theatres — create a new theatre
export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const body = await request.json();
  const parsed = validate(createTheatreSchema, body);
  if (!parsed.success) return parsed.response;

  const { name, description, icon, color } = parsed.data;

  const { data, error } = await supabase
    .from("theatres")
    .insert({
      name,
      description,
      icon: icon || null,
      color: color || "#8b5cf6",
      user_id: user!.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
