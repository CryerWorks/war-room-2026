// ingest.ts — AI document ingestion engine.
// Takes raw text (a training regimen, syllabus, study plan, etc.)
// and uses the Claude API to parse it into the War Room hierarchy:
// Goal → Operations → Phases → Modules.
//
// The output is a structured JSON object matching our data model,
// which the /api/ingest route then uses to create all entities in Supabase.

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// The shape Claude should return — matches our creation APIs
export interface IngestPlan {
  goal: {
    title: string;
    description: string;
    icon: string;
    target_date: string | null;
  };
  operations: Array<{
    title: string;
    description: string;
    phases: Array<{
      title: string;
      description: string;
      modules: Array<{
        title: string;
        description: string;
        scheduled_date: string | null;
        start_time: string | null;
        end_time: string | null;
      }>;
    }>;
  }>;
}

/**
 * Parse a document into a structured goal hierarchy using Claude.
 *
 * @param documentText — the raw text of the document to parse
 * @param domainSlug — which domain this belongs to (linguistic, skill, physical)
 * @param startDate — when to start scheduling modules (YYYY-MM-DD)
 * @param preferences — optional user guidance for how to structure the plan
 */
export async function parseDocumentToplan(
  documentText: string,
  domainSlug: string,
  startDate: string,
  preferences?: string
): Promise<IngestPlan> {
  const domainContext = {
    linguistic: "language learning and communication",
    skill: "technical and programming skill development",
    physical: "physical fitness and health",
  }[domainSlug] || domainSlug;

  const prompt = `You are a structured planning assistant for a personal goal-tracking application.

Your job is to parse the following document into a hierarchical plan structure. The document describes a program related to ${domainContext}.

The hierarchy is:
- **Goal**: The overarching objective this program achieves
- **Operations**: Major workstreams or training blocks within the goal (e.g., mesocycles, course sections, skill tracks)
- **Phases**: Sequential stages within each operation (e.g., weeks, difficulty levels, progression stages)
- **Modules**: Individual daily activities/sessions within each phase (e.g., workouts, lessons, practice sessions)

Rules:
- Start scheduling modules from ${startDate}
- Space modules appropriately (don't schedule everything on the same day)
- For physical training, allow rest days between sessions
- For learning, space sessions to allow retention
- Use the format HH:MM for times (24-hour). If the document specifies session durations, use them. Otherwise, estimate reasonable durations.
- If a module doesn't have a natural date, leave scheduled_date as null
- Choose an appropriate emoji icon for the goal
- Keep titles concise but descriptive
- Descriptions should capture the key details from the source document

${preferences ? `Additional user preferences: ${preferences}` : ""}

IMPORTANT: Respond with ONLY valid JSON matching this exact structure, no markdown code fences, no explanation:

{
  "goal": {
    "title": "string",
    "description": "string",
    "icon": "emoji",
    "target_date": "YYYY-MM-DD or null"
  },
  "operations": [
    {
      "title": "string",
      "description": "string",
      "phases": [
        {
          "title": "string",
          "description": "string",
          "modules": [
            {
              "title": "string",
              "description": "string",
              "scheduled_date": "YYYY-MM-DD or null",
              "start_time": "HH:MM or null",
              "end_time": "HH:MM or null"
            }
          ]
        }
      ]
    }
  ]
}

Here is the document to parse:

---
${documentText}
---`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // Extract the text response
  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  // Parse the JSON — Claude should return clean JSON per our instructions
  // Strip any markdown fences if present (defensive)
  const cleaned = responseText
    .replace(/^```json?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();

  const plan: IngestPlan = JSON.parse(cleaned);

  // Basic validation
  if (!plan.goal?.title || !Array.isArray(plan.operations)) {
    throw new Error("Claude returned an invalid plan structure");
  }

  return plan;
}
