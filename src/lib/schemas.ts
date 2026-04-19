// Zod validation schemas for all API request bodies.
// Each schema defines the shape AND constraints of incoming data.
// Use `z.infer<typeof schema>` to derive TypeScript types for free.

import { z } from "zod";

// ============================================================
// Shared primitives — reused across multiple schemas
// ============================================================

const uuid = z.string().uuid("Invalid UUID format");
const optionalUuid = z.string().uuid("Invalid UUID format").nullable().optional();
const requiredTitle = z.string().min(1, "Title is required").max(200, "Title too long (max 200 chars)");
const optionalDescription = z.string().max(5000, "Description too long (max 5000 chars)").optional().default("");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format");
const optionalIsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format").nullable().optional();
const timeString = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be HH:MM or HH:MM:SS format").nullable().optional();
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex code like #ff5500").optional();
const entityStatus = z.enum(["active", "completed", "archived"]);
const phaseStatus = z.enum(["pending", "active", "completed"]);

// ============================================================
// Goals
// ============================================================

export const createGoalSchema = z.object({
  domain_id: uuid,
  title: requiredTitle,
  description: optionalDescription,
  icon: z.string().max(100).nullable().optional(),
  target_date: optionalIsoDate,
  theatre_id: optionalUuid,
});

export const updateGoalSchema = z.object({
  title: requiredTitle.optional(),
  description: z.string().max(5000).optional(),
  icon: z.string().max(100).nullable().optional(),
  target_date: optionalIsoDate,
  theatre_id: optionalUuid,
  status: entityStatus.optional(),
  completed_at: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

export const mergeGoalsSchema = z.object({
  source_id: uuid,
  target_id: uuid,
}).refine((data) => data.source_id !== data.target_id, {
  message: "Cannot merge a goal into itself",
});

// ============================================================
// Operations
// ============================================================

export const createOperationSchema = z.object({
  goal_id: uuid,
  domain_id: uuid,
  title: requiredTitle,
  description: optionalDescription,
});

export const updateOperationSchema = z.object({
  title: requiredTitle.optional(),
  description: z.string().max(5000).optional(),
  status: entityStatus.optional(),
  completed_at: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

// ============================================================
// Phases
// ============================================================

export const createPhaseSchema = z.object({
  operation_id: uuid,
  title: requiredTitle,
  description: optionalDescription,
  sort_order: z.number().int().min(0).optional().default(0),
});

export const updatePhaseSchema = z.object({
  title: requiredTitle.optional(),
  description: z.string().max(5000).optional(),
  status: phaseStatus.optional(),
  completed_at: z.string().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

// ============================================================
// Modules
// ============================================================

export const createModuleSchema = z.object({
  title: requiredTitle,
  description: optionalDescription,
  domain_id: uuid,
  goal_id: optionalUuid,
  operation_id: optionalUuid,
  phase_id: optionalUuid,
  scheduled_date: isoDate,
  start_time: timeString,
  end_time: timeString,
});

export const updateModuleSchema = z.object({
  title: requiredTitle.optional(),
  description: z.string().max(5000).optional(),
  domain_id: uuid.optional(),
  goal_id: optionalUuid,
  operation_id: optionalUuid,
  phase_id: optionalUuid,
  scheduled_date: isoDate.optional(),
  start_time: timeString,
  end_time: timeString,
  is_completed: z.boolean().optional(),
  completed_at: z.string().nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

// ============================================================
// Tags
// ============================================================

export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name too long (max 50 chars)"),
  color: hexColor,
});

// ============================================================
// Module Tags
// ============================================================

export const createModuleTagSchema = z.object({
  module_id: uuid,
  tag_id: uuid,
});

// ============================================================
// Notes
// ============================================================

export const createNoteSchema = z.object({
  module_id: uuid,
  content: z.string().min(1, "Note content is required").max(10000, "Note too long (max 10000 chars)"),
});

// ============================================================
// Dependencies
// ============================================================

export const createDependencySchema = z.object({
  module_id: uuid,
  depends_on_id: uuid,
}).refine((data) => data.module_id !== data.depends_on_id, {
  message: "A module cannot depend on itself",
});

// ============================================================
// Theatres
// ============================================================

export const createTheatreSchema = z.object({
  name: requiredTitle,
  description: optionalDescription,
  icon: z.string().max(100).nullable().optional(),
  color: hexColor,
});

export const updateTheatreSchema = z.object({
  name: requiredTitle.optional(),
  description: z.string().max(5000).optional(),
  icon: z.string().max(100).nullable().optional(),
  color: hexColor,
  status: entityStatus.optional(),
  completed_at: z.string().nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

// ============================================================
// Recurrence Rules
// ============================================================

export const createRecurrenceSchema = z.object({
  title: requiredTitle,
  description: optionalDescription,
  domain_id: uuid,
  operation_id: optionalUuid,
  phase_id: optionalUuid,
  start_time: timeString,
  end_time: timeString,
  pattern: z.enum(["daily", "weekly", "monthly"]),
  days_of_week: z.array(z.number().int().min(0).max(6)).optional().default([]),
  start_date: isoDate,
  end_date: optionalIsoDate,
});

export const updateRecurrenceSchema = z.object({
  title: requiredTitle.optional(),
  description: z.string().max(5000).optional(),
  pattern: z.enum(["daily", "weekly", "monthly"]).optional(),
  days_of_week: z.array(z.number().int().min(0).max(6)).optional(),
  start_date: isoDate.optional(),
  end_date: optionalIsoDate,
  start_time: timeString,
  end_time: timeString,
  is_active: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

// ============================================================
// Ingest (AI document parsing)
// ============================================================

const MAX_DOCUMENT_LENGTH = 50_000; // ~50KB of text

export const ingestSchema = z.object({
  document_text: z.string()
    .min(1, "Document text is required")
    .max(MAX_DOCUMENT_LENGTH, `Document too large (max ${MAX_DOCUMENT_LENGTH.toLocaleString()} chars)`),
  domain_id: uuid,
  domain_slug: z.string().min(1).max(100),
  start_date: isoDate,
  preferences: z.string().max(2000, "Preferences too long (max 2000 chars)").optional(),
});
