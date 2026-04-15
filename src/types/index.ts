// ============================================================
// Domain — the three goal areas (linguistic, skill, physical)
// ============================================================
export type DomainSlug = "linguistic" | "skill" | "physical";

export interface Domain {
  id: string;
  name: string;
  slug: DomainSlug;
  description: string;
  color: string;        // hex color for UI (progress bars, badges)
  created_at: string;
}

// ============================================================
// Goal — a specific objective within a domain
// ============================================================
export interface Goal {
  id: string;
  domain_id: string;
  title: string;
  description: string;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Module — a scheduled activity on a specific date
// ============================================================
export interface Module {
  id: string;
  domain_id: string;
  goal_id: string | null;   // optional — can be a standalone activity
  title: string;
  description: string;
  scheduled_date: string;    // YYYY-MM-DD
  start_time: string | null; // HH:MM (24h), null if all-day
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
// Derived types for the UI
// ============================================================

// Module with its notes and parent domain info pre-joined
export interface ModuleWithDetails extends Module {
  domain: Domain;
  notes: ModuleNote[];
}

// Progress stats for a single domain
export interface DomainProgress {
  domain: Domain;
  total_modules: number;
  completed_modules: number;
  completion_percentage: number;
}

// Aggregate progress across all domains
export interface AggregateProgress {
  domains: DomainProgress[];
  total_modules: number;
  completed_modules: number;
  completion_percentage: number;
}
