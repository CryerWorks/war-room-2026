import { NextResponse } from "next/server";
import { generateRecurringModules } from "@/lib/recurrence";

// POST /api/recurrence/generate — trigger generation for all active rules.
// Called on dashboard load to keep the rolling 4-week window current.
// Idempotent — safe to call multiple times, won't create duplicates.
export async function POST() {
  try {
    const created = await generateRecurringModules();
    return NextResponse.json({ generated: created });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Generation failed" },
      { status: 500 }
    );
  }
}
