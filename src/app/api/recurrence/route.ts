import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/recurrence — list all recurrence rules
export async function GET() {
  const { data, error } = await supabase
    .from("recurrence_rules")
    .select("*, domain:domains(name, slug, color)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/recurrence — create a new recurrence rule
// Body: { title, description, domain_id, operation_id?, phase_id?,
//         start_time?, end_time?, pattern, days_of_week?, start_date, end_date? }
export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    title, description, domain_id, operation_id, phase_id,
    start_time, end_time, pattern, days_of_week, start_date, end_date,
  } = body;

  if (!title || !domain_id || !pattern || !start_date) {
    return NextResponse.json(
      { error: "title, domain_id, pattern, and start_date are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("recurrence_rules")
    .insert({
      title,
      description: description || "",
      domain_id,
      operation_id: operation_id || null,
      phase_id: phase_id || null,
      start_time: start_time || null,
      end_time: end_time || null,
      pattern,
      days_of_week: days_of_week || [],
      start_date,
      end_date: end_date || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
