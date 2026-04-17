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

CRITICAL JSON RULES:
- Respond with ONLY valid JSON. No markdown fences, no explanation, no comments.
- All strings must use double quotes. Escape any double quotes inside strings with backslash.
- No trailing commas after the last item in arrays or objects.
- Keep descriptions concise (under 200 characters) to avoid escaping issues.
- Use null (without quotes) for null values, not the string "null".

The JSON must match this exact structure:

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
    max_tokens: 8192,
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

  // Attempt to parse with progressive cleaning
  const plan = await parseJsonResponse(responseText);

  // Basic validation
  if (!plan.goal?.title || !Array.isArray(plan.operations)) {
    throw new Error("Claude returned an invalid plan structure");
  }

  return plan;
}

/**
 * Parse Claude's JSON response with progressive cleaning.
 * If standard parse fails, applies fixes for common LLM JSON issues.
 * As a last resort, asks Claude to fix its own broken JSON.
 */
async function parseJsonResponse(raw: string): Promise<IngestPlan> {
  // Step 1: Strip markdown fences and surrounding whitespace
  let cleaned = raw
    .replace(/^```json?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  // Step 2: Try parsing as-is
  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue to cleaning
  }

  // Step 3: Fix common LLM JSON issues
  cleaned = cleaned
    // Remove trailing commas before } or ]
    .replace(/,\s*([\]}])/g, "$1")
    // Remove single-line comments
    .replace(/\/\/.*$/gm, "")
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Fix unquoted null/true/false that might have gotten quoted
    .replace(/:\s*"null"/g, ": null")
    .replace(/:\s*"true"/g, ": true")
    .replace(/:\s*"false"/g, ": false");

  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue to extraction
  }

  // Step 4: Try to extract JSON from surrounding text
  // Claude sometimes wraps JSON in explanation text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const extracted = jsonMatch[0]
      .replace(/,\s*([\]}])/g, "$1");
    try {
      return JSON.parse(extracted);
    } catch {
      // Continue to retry
    }
  }

  // Step 5: Last resort — ask Claude to fix the broken JSON
  const fixMessage = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `The following JSON is malformed. Fix it so it is valid JSON and return ONLY the fixed JSON, nothing else:\n\n${cleaned}`,
      },
    ],
  });

  const fixedText = fixMessage.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .replace(/^```json?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  return JSON.parse(fixedText);
}
