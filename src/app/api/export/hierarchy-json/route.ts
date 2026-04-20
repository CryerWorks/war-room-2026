import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";

// GET /api/export/hierarchy-json — download the full goal hierarchy as JSON.
// Structure: domains → goals → operations → phases → modules
export async function GET() {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  // Fetch all data in parallel
  const [domainsResult, goalsResult, operationsResult, phasesResult, modulesResult] =
    await Promise.all([
      supabase.from("domains").select("*").order("name"),
      supabase.from("goals").select("*").is("deleted_at", null).order("sort_order"),
      supabase.from("operations").select("*").is("deleted_at", null).order("sort_order"),
      supabase.from("phases").select("*").is("deleted_at", null).order("sort_order"),
      supabase
        .from("modules")
        .select("*")
        .is("deleted_at", null)
        .order("scheduled_date")
        .order("start_time", { nullsFirst: false }),
    ]);

  const domains = domainsResult.data || [];
  const goals = goalsResult.data || [];
  const operations = operationsResult.data || [];
  const phases = phasesResult.data || [];
  const modules = modulesResult.data || [];

  // Assemble hierarchy
  const hierarchy = domains.map((domain) => ({
    ...domain,
    goals: goals
      .filter((g) => g.domain_id === domain.id)
      .map((goal) => ({
        ...goal,
        operations: operations
          .filter((op) => op.goal_id === goal.id)
          .map((op) => ({
            ...op,
            phases: phases
              .filter((p) => p.operation_id === op.id)
              .map((phase) => ({
                ...phase,
                modules: modules.filter((m) => m.phase_id === phase.id),
              })),
            // Modules linked directly to operation (no phase)
            unphased_modules: modules.filter(
              (m) => m.operation_id === op.id && !m.phase_id
            ),
          })),
        // Modules linked directly to goal (no operation)
        standalone_modules: modules.filter(
          (m) => m.goal_id === goal.id && !m.operation_id
        ),
      })),
    // Modules linked only to domain (no goal)
    unlinked_modules: modules.filter(
      (m) => m.domain_id === domain.id && !m.goal_id
    ),
  }));

  const exportData = {
    exported_at: new Date().toISOString(),
    counts: {
      domains: domains.length,
      goals: goals.length,
      operations: operations.length,
      phases: phases.length,
      modules: modules.length,
    },
    data: hierarchy,
  };

  const json = JSON.stringify(exportData, null, 2);
  const date = new Date().toISOString().split("T")[0];

  return new Response(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="war-room-export-${date}.json"`,
    },
  });
}
