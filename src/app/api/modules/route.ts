import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";

// GET /api/modules?date=2026-04-15&start_date=...&end_date=...&domain_id=xxx
// Fetch modules, optionally filtered by date/range and/or domain
export async function GET(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const domainId = searchParams.get("domain_id");

  let query = supabase
    .from("modules")
    .select("*, domain:domains(*), notes:module_notes(*), operation:operations(title, goal:goals(title, icon)), phase:phases(title), tags:module_tags!module_id(id, tag_id, tag:tags(*))")
    .order("scheduled_date")
    .order("start_time", { nullsFirst: false });

  if (date) {
    query = query.eq("scheduled_date", date);
  } else if (startDate && endDate) {
    query = query.gte("scheduled_date", startDate).lte("scheduled_date", endDate);
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
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const body = await request.json();

  const {
    title, description, domain_id, goal_id,
    operation_id, phase_id,
    scheduled_date, start_time, end_time,
  } = body;

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
      operation_id: operation_id || null,
      phase_id: phase_id || null,
      scheduled_date,
      start_time: start_time || null,
      end_time: end_time || null,
      user_id: user!.id,
    })
    .select("*, domain:domains(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
