import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";
import { calculateModuleHours } from "@/lib/hours";

// GET /api/export/modules-csv — download all modules as a CSV file.
// Columns: date, title, domain, operation, phase, status, hours
export async function GET() {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { data: modules, error } = await supabase
    .from("modules")
    .select(
      "scheduled_date, title, is_completed, start_time, end_time, domain:domains(name), operation:operations(title), phase:phases(title)"
    )
    .is("deleted_at", null)
    .order("scheduled_date", { ascending: false })
    .order("start_time", { nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // CSV header
  const rows: string[] = ["date,title,domain,operation,phase,status,hours"];

  for (const mod of modules || []) {
    const domain =
      (mod.domain as unknown as { name: string } | null)?.name || "";
    const operation =
      (mod.operation as unknown as { title: string } | null)?.title || "";
    const phase =
      (mod.phase as unknown as { title: string } | null)?.title || "";
    const status = mod.is_completed ? "completed" : "pending";
    const hours = calculateModuleHours(mod.start_time, mod.end_time);

    // Escape CSV fields that may contain commas or quotes
    const fields = [
      mod.scheduled_date,
      csvEscape(mod.title),
      csvEscape(domain),
      csvEscape(operation),
      csvEscape(phase),
      status,
      hours.toFixed(1),
    ];

    rows.push(fields.join(","));
  }

  const csv = rows.join("\n");
  const date = new Date().toISOString().split("T")[0];

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="war-room-modules-${date}.csv"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
