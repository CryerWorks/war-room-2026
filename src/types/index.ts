// ============================================================
// Theatre — cross-domain strategic supergroup
// ============================================================
export type TheatreStatus = "active" | "completed" | "archived";

export interface Theatre {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  color: string;
  status: TheatreStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Domain — the three goal areas (linguistic, skill, physical)
// ============================================================
export type DomainSlug = "linguistic" | "skill" | "physical";

export interface Domain {
  id: string;
  name: string;
  slug: DomainSlug;
  description: string;
  color: string;
  created_at: string;
}

// ============================================================
// Goal — a high-level objective within a domain
// ============================================================
export type GoalStatus = "active" | "completed" | "archived";

export interface Goal {
  id: string;
  domain_id: string;
  theatre_id: string | null;
  title: string;
  description: string;
  icon: string | null;
  status: GoalStatus;
  target_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Operation — a structured program of work under a goal
// ============================================================
export type OperationStatus = "active" | "completed" | "archived";

export interface Operation {
  id: string;
  goal_id: string;
  domain_id: string;
  title: string;
  description: string;
  status: OperationStatus;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Phase — a sequential stage within an operation
// ============================================================
export type PhaseStatus = "pending" | "active" | "completed";

export interface Phase {
  id: string;
  operation_id: string;
  title: string;
  description: string;
  sort_order: number;
  status: PhaseStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Module — a scheduled activity on a specific date
// ============================================================
export interface Module {
  id: string;
  domain_id: string;
  goal_id: string | null;
  operation_id: string | null;
  phase_id: string | null;
  title: string;
  description: string;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// ModuleNote — notes attached to a module
// ============================================================
export interface ModuleNote {
  id: string;
  module_id: string;
  content: string;
  created_at: string;
}

// ============================================================
// Streak tracking
// ============================================================
export interface UserStats {
  id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  updated_at: string;
}

export interface DomainStreak {
  id: string;
  domain_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  updated_at: string;
}

// ============================================================
// Derived types — pre-joined for the UI
// ============================================================

export interface ModuleWithDetails extends Module {
  domain: Domain;
  notes: ModuleNote[];
}

export interface PhaseWithModules extends Phase {
  modules: Module[];
  // Computed in-app
  total_modules: number;
  completed_modules: number;
  completion_percentage: number;
  total_hours: number;
}

export interface OperationWithPhases extends Operation {
  phases: PhaseWithModules[];
  goal?: Goal;
  // Computed in-app
  total_modules: number;
  completed_modules: number;
  total_phases: number;
  completed_phases: number;
  completion_percentage: number;
  total_hours: number;
}

export interface GoalWithOperations extends Goal {
  domain: Domain;
  operations: OperationWithPhases[];
  // Computed in-app
  total_operations: number;
  completed_operations: number;
  completion_percentage: number;
  total_hours: number;
}

export interface DomainWithGoals extends Domain {
  goals: GoalWithOperations[];
  streak: DomainStreak | null;
  // Computed in-app
  active_goals: number;
  completed_goals: number;
  active_operations: number;
  total_hours: number;
}

// ============================================================
// Progress stats (reusable shape for UI components)
// ============================================================
export interface ProgressStats {
  completed: number;
  total: number;
  percentage: number;
  hours: number;
}

// ============================================================
// Completion events — for cascade overlays
// ============================================================
export type CompletionTier = "phase" | "operation" | "goal";

export interface CompletionEvent {
  tier: CompletionTier;
  name: string;
  icon?: string | null;
  color: string;
  stats: {
    modules_completed: number;
    hours_spent: number;
    phases_completed?: number;
    operations_completed?: number;
    time_to_complete?: string; // human-readable duration
  };
  context: {
    label: string; // e.g. "Operation" or "Goal"
    name: string;  // e.g. "Backend Program" or "Build Full-Stack Skills"
  } | null;
}

// ============================================================
// Legacy types (kept for dashboard backward compatibility)
// ============================================================
export interface DomainProgress {
  domain: Domain;
  total_modules: number;
  completed_modules: number;
  completion_percentage: number;
}

export interface AggregateProgress {
  domains: DomainProgress[];
  total_modules: number;
  completed_modules: number;
  completion_percentage: number;
}
