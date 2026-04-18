// recurrence.ts — recurring module generation engine.
//
// ARCHITECTURE: Template + Generated Instances
//
// Each recurrence rule is a template that defines:
//   - WHAT to create (title, description, domain, operation, phase, times)
//   - WHEN to create it (pattern: daily, weekly, specific days of week)
//   - HOW FAR to generate (4-week rolling window)
//
// The generator looks at each active rule, checks what's already been
// generated (via last_generated date), and creates module rows for any
// missing dates in the next 4 weeks.
//
// Generated modules are REAL rows in the modules table — they work with
// every existing feature (calendar, today focus, completion, cascades)
// without any modifications to those systems.
//
// WHY 4 weeks? Short enough that changes to rules apply quickly.
// Long enough that you can see your schedule for the month ahead.

import type { SupabaseClient } from "@supabase/supabase-js";

const GENERATION_WINDOW_DAYS = 28; // 4 weeks ahead

/**
 * Get all dates between start and end (inclusive) that match a recurrence pattern.
 */
function getMatchingDates(
  startDate: Date,
  endDate: Date,
  pattern: string,
  daysOfWeek: number[]
): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    let matches = false;

    switch (pattern) {
      case "daily":
        matches = true;
        break;
      case "weekly":
        // Weekly on the same day as start_date
        matches = dayOfWeek === startDate.getDay();
        break;
      case "specific_days":
        matches = daysOfWeek.includes(dayOfWeek);
        break;
    }

    if (matches) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Generate modules for a single recurrence rule.
 * Only creates modules for dates that don't already have one from this rule.
 * Returns the number of modules created.
 */
async function generateForRule(supabase: SupabaseClient, rule: any): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate the generation window
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + GENERATION_WINDOW_DAYS);

  // Don't generate past the rule's end_date
  const ruleEnd = rule.end_date ? new Date(rule.end_date) : windowEnd;
  const effectiveEnd = ruleEnd < windowEnd ? ruleEnd : windowEnd;

  // Start from the day after last_generated (or from rule's start_date)
  const generateFrom = rule.last_generated
    ? new Date(new Date(rule.last_generated).getTime() + 86400000) // +1 day
    : new Date(rule.start_date);

  // Don't generate for past dates (unless the rule just started)
  const effectiveStart = generateFrom < today ? today : generateFrom;

  if (effectiveStart > effectiveEnd) return 0;

  // Get matching dates
  const dates = getMatchingDates(
    effectiveStart,
    effectiveEnd,
    rule.pattern,
    rule.days_of_week || []
  );

  if (dates.length === 0) return 0;

  // Check which dates already have modules from this rule (avoid duplicates)
  const { data: existing } = await supabase
    .from("modules")
    .select("scheduled_date")
    .eq("recurrence_id", rule.id)
    .in("scheduled_date", dates);

  const existingDates = new Set((existing || []).map((m) => m.scheduled_date));
  const newDates = dates.filter((d) => !existingDates.has(d));

  if (newDates.length === 0) {
    // Still update last_generated even if no new modules
    await supabase
      .from("recurrence_rules")
      .update({ last_generated: dates[dates.length - 1] })
      .eq("id", rule.id);
    return 0;
  }

  // Create modules for new dates
  const modules = newDates.map((date) => ({
    title: rule.title,
    description: rule.description,
    domain_id: rule.domain_id,
    operation_id: rule.operation_id || null,
    phase_id: rule.phase_id || null,
    recurrence_id: rule.id,
    scheduled_date: date,
    start_time: rule.start_time || null,
    end_time: rule.end_time || null,
  }));

  const { error } = await supabase.from("modules").insert(modules);
  if (error) return 0;

  // Update last_generated to the furthest date we generated
  await supabase
    .from("recurrence_rules")
    .update({
      last_generated: newDates[newDates.length - 1],
      updated_at: new Date().toISOString(),
    })
    .eq("id", rule.id);

  return newDates.length;
}

/**
 * Generate modules for ALL active recurrence rules.
 * Call this on dashboard load to keep the rolling window current.
 * Returns total number of new modules created.
 */
export async function generateRecurringModules(supabase: SupabaseClient): Promise<number> {
  const { data: rules } = await supabase
    .from("recurrence_rules")
    .select("*")
    .eq("is_active", true);

  if (!rules || rules.length === 0) return 0;

  let totalCreated = 0;
  for (const rule of rules) {
    totalCreated += await generateForRule(supabase, rule);
  }

  return totalCreated;
}
