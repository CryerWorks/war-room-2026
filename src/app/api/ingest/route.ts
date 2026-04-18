import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";
import { parseDocumentToplan } from "@/lib/ingest";

// POST /api/ingest — parse a document and create the full goal hierarchy.
//
// Body:
// {
//   document_text: string,     — the raw text to parse
//   domain_id: string,         — which domain to create the goal under
//   domain_slug: string,       — slug for context in the prompt
//   start_date: string,        — YYYY-MM-DD, when to start scheduling
//   preferences?: string       — optional guidance for the AI
// }
//
// This endpoint:
// 1. Sends the document to Claude for parsing
// 2. Creates the goal in Supabase
// 3. Creates each operation under the goal
// 4. Creates each phase under its operation
// 5. Creates each module under its phase
// 6. Returns the complete created hierarchy

export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  try {
    const body = await request.json();
    const { document_text, domain_id, domain_slug, start_date, preferences } = body;

    if (!document_text || !domain_id || !domain_slug || !start_date) {
      return NextResponse.json(
        { error: "document_text, domain_id, domain_slug, and start_date are required" },
        { status: 400 }
      );
    }

    // Step 1: Parse the document with Claude
    const plan = await parseDocumentToplan(
      document_text,
      domain_slug,
      start_date,
      preferences
    );

    // Step 2: Create the goal
    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .insert({
        domain_id,
        title: plan.goal.title,
        description: plan.goal.description,
        icon: plan.goal.icon,
        target_date: plan.goal.target_date,
        user_id: user!.id,
      })
      .select()
      .single();

    if (goalError || !goal) {
      return NextResponse.json(
        { error: `Failed to create goal: ${goalError?.message}` },
        { status: 500 }
      );
    }

    // Step 3: Create operations, phases, and modules in sequence
    let totalOperations = 0;
    let totalPhases = 0;
    let totalModules = 0;

    for (const opPlan of plan.operations) {
      // Create operation
      const { data: operation, error: opError } = await supabase
        .from("operations")
        .insert({
          goal_id: goal.id,
          domain_id,
          title: opPlan.title,
          description: opPlan.description,
          sort_order: totalOperations,
          user_id: user!.id,
        })
        .select()
        .single();

      if (opError || !operation) continue;
      totalOperations++;

      let phaseOrder = 0;
      for (const phasePlan of opPlan.phases) {
        // Create phase
        const { data: phase, error: phaseError } = await supabase
          .from("phases")
          .insert({
            operation_id: operation.id,
            title: phasePlan.title,
            description: phasePlan.description,
            sort_order: phaseOrder,
            // First phase of first operation starts as "active"
            status: totalOperations === 1 && phaseOrder === 0 ? "active" : "pending",
            user_id: user!.id,
          })
          .select()
          .single();

        if (phaseError || !phase) continue;
        totalPhases++;
        phaseOrder++;

        // Create modules for this phase
        for (const modPlan of phasePlan.modules) {
          const { error: modError } = await supabase
            .from("modules")
            .insert({
              domain_id,
              operation_id: operation.id,
              phase_id: phase.id,
              title: modPlan.title,
              description: modPlan.description,
              scheduled_date: modPlan.scheduled_date || start_date,
              start_time: modPlan.start_time,
              end_time: modPlan.end_time,
              user_id: user!.id,
            });

          if (!modError) totalModules++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      goal_id: goal.id,
      summary: {
        goal: plan.goal.title,
        operations: totalOperations,
        phases: totalPhases,
        modules: totalModules,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process document" },
      { status: 500 }
    );
  }
}
