import type { SupabaseClient } from "@supabase/supabase-js";
import { sumModuleHours, timeBetween } from "./hours";
import type { CompletionEvent } from "@/types";

/**
 * Get today's date as YYYY-MM-DD.
 */
function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// ============================================================
// Streak updates
// ============================================================

/**
 * Update the global streak. Call when a module is completed.
 * Logic: if last active was yesterday → increment. If today → no-op. Otherwise → reset to 1.
 */
export async function updateGlobalStreak(supabase: SupabaseClient): Promise<void> {
  const today = todayStr();
  const { data } = await supabase.from("user_stats").select("*").single();
  if (!data) return;

  if (data.last_active_date === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().split("T")[0];

  const newStreak =
    data.last_active_date === yesterdayISO ? data.current_streak + 1 : 1;

  await supabase
    .from("user_stats")
    .update({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, data.longest_streak),
      last_active_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);
}

/**
 * Update a domain-specific streak. Same logic as global but scoped to one domain.
 */
export async function updateDomainStreak(supabase: SupabaseClient, domainId: string): Promise<void> {
  const today = todayStr();
  const { data } = await supabase
    .from("domain_streaks")
    .select("*")
    .eq("domain_id", domainId)
    .single();
  if (!data) return;

  if (data.last_active_date === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().split("T")[0];

  const newStreak =
    data.last_active_date === yesterdayISO ? data.current_streak + 1 : 1;

  await supabase
    .from("domain_streaks")
    .update({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, data.longest_streak),
      last_active_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);
}

// ============================================================
// Completion cascade checks
// Each returns a CompletionEvent if a completion just happened,
// or null if nothing changed.
// ============================================================

/**
 * Check if all modules in a phase are completed.
 * If so, auto-mark the phase as completed and return overlay data.
 */
export async function checkPhaseCompletion(
  supabase: SupabaseClient,
  phaseId: string
): Promise<CompletionEvent | null> {
  // Fetch the phase with its parent chain (operation → goal → domain)
  const { data: phase } = await supabase
    .from("phases")
    .select("*, operation:operations(*, goal:goals(*, domain:domains(*)))")
    .eq("id", phaseId)
    .single();

  if (!phase || phase.status === "completed") return null;

  // Get all modules in this phase
  const { data: modules } = await supabase
    .from("modules")
    .select("is_completed, start_time, end_time")
    .eq("phase_id", phaseId);

  if (!modules || modules.length === 0) return null;
  if (!modules.every((m) => m.is_completed)) return null;

  // All done — mark phase completed
  await supabase
    .from("phases")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", phaseId);

  const operation = phase.operation;
  const domain = operation?.goal?.domain;

  return {
    tier: "phase",
    name: phase.title,
    color: domain?.color || "#6366f1",
    stats: {
      modules_completed: modules.length,
      hours_spent: sumModuleHours(modules),
    },
    context: operation
      ? { label: "Operation", name: operation.title }
      : null,
  };
}

/**
 * Check if all phases in an operation are completed.
 * If so, auto-mark the operation as completed and return overlay data.
 */
export async function checkOperationCompletion(
  supabase: SupabaseClient,
  operationId: string
): Promise<CompletionEvent | null> {
  const { data: operation } = await supabase
    .from("operations")
    .select("*, goal:goals(*, domain:domains(*))")
    .eq("id", operationId)
    .single();

  if (!operation || operation.status === "completed") return null;

  const { data: phases } = await supabase
    .from("phases")
    .select("status")
    .eq("operation_id", operationId);

  if (!phases || phases.length === 0) return null;
  if (!phases.every((p) => p.status === "completed")) return null;

  // All phases done — mark operation completed
  await supabase
    .from("operations")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", operationId);

  // Sum hours across all modules in this operation
  const { data: modules } = await supabase
    .from("modules")
    .select("is_completed, start_time, end_time")
    .eq("operation_id", operationId);

  const goal = operation.goal;
  const domain = goal?.domain;

  return {
    tier: "operation",
    name: operation.title,
    color: domain?.color || "#6366f1",
    stats: {
      modules_completed: modules?.filter((m) => m.is_completed).length || 0,
      hours_spent: sumModuleHours(modules || []),
      phases_completed: phases.length,
    },
    context: goal ? { label: "Goal", name: goal.title } : null,
  };
}

/**
 * Check if all operations in a goal are completed.
 * If so, auto-mark the goal as achieved and return overlay data.
 */
export async function checkGoalCompletion(
  supabase: SupabaseClient,
  goalId: string
): Promise<CompletionEvent | null> {
  const { data: goal } = await supabase
    .from("goals")
    .select("*, domain:domains(*)")
    .eq("id", goalId)
    .single();

  if (!goal || goal.status === "completed") return null;

  const { data: operations } = await supabase
    .from("operations")
    .select("id, status")
    .eq("goal_id", goalId);

  if (!operations || operations.length === 0) return null;
  if (!operations.every((o) => o.status === "completed")) return null;

  // All operations done — goal achieved!
  await supabase
    .from("goals")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", goalId);

  // Sum hours across all operations' modules
  const opIds = operations.map((o) => o.id);
  let totalHours = 0;
  let totalModules = 0;

  if (opIds.length > 0) {
    const { data: modules } = await supabase
      .from("modules")
      .select("is_completed, start_time, end_time")
      .in("operation_id", opIds);

    totalHours = sumModuleHours(modules || []);
    totalModules = modules?.filter((m) => m.is_completed).length || 0;
  }

  const domain = goal.domain;

  return {
    tier: "goal",
    name: goal.title,
    icon: goal.icon,
    color: domain?.color || "#6366f1",
    stats: {
      modules_completed: totalModules,
      hours_spent: totalHours,
      operations_completed: operations.length,
      time_to_complete: timeBetween(goal.created_at, new Date().toISOString()),
    },
    context: null,
  };
}

// ============================================================
// Main entry point — called from the module PATCH API route
// ============================================================

/**
 * Run the full completion cascade for a just-completed module.
 * Returns an array of CompletionEvents for the UI to show as overlays.
 *
 * The cascade: module → phase → operation → goal
 * Each level only triggers if ALL siblings at that level are complete.
 */
export async function runCompletionCascade(
  supabase: SupabaseClient,
  modulePhaseId: string | null,
  moduleOperationId: string | null,
  moduleDomainId: string
): Promise<CompletionEvent[]> {
  const events: CompletionEvent[] = [];

  // Always update streaks on completion
  await updateGlobalStreak(supabase);
  await updateDomainStreak(supabase, moduleDomainId);

  // If module isn't linked to a phase, no cascade to check
  if (!modulePhaseId) return events;

  // Auto-activate: if this module's phase is still "pending", activate it
  // ONLY if all prior phases (lower sort_order) are completed.
  // This enforces sequential progression — you can't skip ahead.
  const { data: currentPhase } = await supabase
    .from("phases")
    .select("status, operation_id, sort_order")
    .eq("id", modulePhaseId)
    .single();

  if (currentPhase && currentPhase.status === "pending" && currentPhase.operation_id) {
    // Check all prior phases are completed
    const { data: priorPhases } = await supabase
      .from("phases")
      .select("status")
      .eq("operation_id", currentPhase.operation_id)
      .lt("sort_order", currentPhase.sort_order);

    const allPriorCompleted = !priorPhases || priorPhases.length === 0 ||
      priorPhases.every((p) => p.status === "completed");

    if (allPriorCompleted) {
      // Deactivate any currently active sibling phase
      await supabase
        .from("phases")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("operation_id", currentPhase.operation_id)
        .eq("status", "active");

      // Activate this phase
      await supabase
        .from("phases")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", modulePhaseId);
    }
  }

  // Level 1: did this complete a phase?
  const phaseEvent = await checkPhaseCompletion(supabase, modulePhaseId);

  // If the phase just completed, auto-activate the next sequential phase
  if (phaseEvent && currentPhase?.operation_id) {
    const { data: nextPhase } = await supabase
      .from("phases")
      .select("id")
      .eq("operation_id", currentPhase.operation_id)
      .eq("status", "pending")
      .order("sort_order", { ascending: true })
      .limit(1)
      .single();

    if (nextPhase) {
      await supabase
        .from("phases")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", nextPhase.id);
    }
  }

  if (!phaseEvent) return events;
  events.push(phaseEvent);

  // Level 2: did that complete an operation?
  if (!moduleOperationId) return events;
  const opEvent = await checkOperationCompletion(supabase, moduleOperationId);
  if (!opEvent) return events;
  events.push(opEvent);

  // Level 3: did that achieve a goal?
  const { data: operation } = await supabase
    .from("operations")
    .select("goal_id")
    .eq("id", moduleOperationId)
    .single();

  if (operation?.goal_id) {
    const goalEvent = await checkGoalCompletion(supabase, operation.goal_id);
    if (goalEvent) events.push(goalEvent);
  }

  return events;
}
