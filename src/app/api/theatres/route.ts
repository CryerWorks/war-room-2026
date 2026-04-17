import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/theatres — list all theatres with their goals
export async function GET() {
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
  const body = await request.json();
  const { name, description, icon, color } = body;

  if (!name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("theatres")
    .insert({
      name,
      description: description || "",
      icon: icon || null,
      color: color || "#8b5cf6",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
