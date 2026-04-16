import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/modules?date=2026-04-15&domain_id=xxx
// Fetch modules, optionally filtered by date and/or domain
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const domainId = searchParams.get("domain_id");

  let query = supabase
    .from("modules")
    .select("*, domain:domains(*), notes:module_notes(*)")
    .order("scheduled_date")
    .order("start_time", { nullsFirst: false });

  if (date) {
    query = query.eq("scheduled_date", date);
  }

  if (domainId) {
    query = query.eq("domain_id", domainId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/modules — create a new module
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { title, description, domain_id, goal_id, scheduled_date, start_time, end_time } = body;

  if (!title || !domain_id || !scheduled_date) {
    return NextResponse.json(
      { error: "title, domain_id, and scheduled_date are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("modules")
    .insert({
      title,
      description: description || "",
      domain_id,
      goal_id: goal_id || null,
      scheduled_date,
      start_time: start_time || null,
      end_time: end_time || null,
    })
    .select("*, domain:domains(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
