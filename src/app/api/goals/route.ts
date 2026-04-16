import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/goals?domain_id=xxx&status=active
// Fetch goals for a domain, optionally filtered by status.
// Returns goals with their operations and nested phases.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get("domain_id");
  const status = searchParams.get("status");

  let query = supabase
    .from("goals")
    .select("*, domain:domains(*), operations(*, phases(*, modules:modules(id, is_completed, start_time, end_time)))")
    .order("sort_order")
    .order("created_at");

  if (domainId) {
    query = query.eq("domain_id", domainId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/goals — create a new goal
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { domain_id, title, description, icon, target_date } = body;

  if (!domain_id || !title) {
    return NextResponse.json(
      { error: "domain_id and title are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("goals")
    .insert({
      domain_id,
      title,
      description: description || "",
      icon: icon || null,
      target_date: target_date || null,
    })
    .select("*, domain:domains(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
