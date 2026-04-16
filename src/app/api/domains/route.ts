import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/domains — fetch all domains with their progress stats
export async function GET() {
  // Fetch domains
  const { data: domains, error: domainError } = await supabase
    .from("domains")
    .select("*")
    .order("name");

  if (domainError) {
    return NextResponse.json({ error: domainError.message }, { status: 500 });
  }

  // Fetch module counts per domain
  const { data: modules, error: moduleError } = await supabase
    .from("modules")
    .select("domain_id, is_completed");

  if (moduleError) {
    return NextResponse.json({ error: moduleError.message }, { status: 500 });
  }

  // Calculate progress per domain
  const domainsWithProgress = domains.map((domain) => {
    const domainModules = modules.filter((m) => m.domain_id === domain.id);
    const total = domainModules.length;
    const completed = domainModules.filter((m) => m.is_completed).length;

    return {
      domain,
      total_modules: total,
      completed_modules: completed,
      completion_percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  });

  const totalAll = modules.length;
  const completedAll = modules.filter((m) => m.is_completed).length;

  return NextResponse.json({
    domains: domainsWithProgress,
    total_modules: totalAll,
    completed_modules: completedAll,
    completion_percentage: totalAll === 0 ? 0 : Math.round((completedAll / totalAll) * 100),
  });
}
