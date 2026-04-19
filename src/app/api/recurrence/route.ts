import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";
import { createRecurrenceSchema } from "@/lib/schemas";
import { validate } from "@/lib/validation";

// GET /api/recurrence — list all recurrence rules
export async function GET() {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

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
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const body = await request.json();
  const parsed = validate(createRecurrenceSchema, body);
  if (!parsed.success) return parsed.response;

  const {
    title, description, domain_id, operation_id, phase_id,
    start_time, end_time, pattern, days_of_week, start_date, end_date,
  } = parsed.data;

  const { data, error } = await supabase
    .from("recurrence_rules")
    .insert({
      title,
      description,
      domain_id,
      operation_id: operation_id || null,
      phase_id: phase_id || null,
      start_time: start_time || null,
      end_time: end_time || null,
      pattern,
      days_of_week,
      start_date,
      end_date: end_date || null,
      user_id: user!.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
