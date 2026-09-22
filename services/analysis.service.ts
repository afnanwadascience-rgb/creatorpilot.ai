import Groq from "groq-sdk";
import { AnalysisResultSchema, type AnalysisResult } from "@/types/analysis";

// This file is the ONLY place that talks to the AI provider. Keeping it
// isolated from route handlers and UI means swapping providers later only
// touches this one file.

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

const SYSTEM_PROMPT = `You are CreatorPilot AI, an expert YouTube content strategist and script editor.
You analyze YouTube video scripts and return ONLY a single JSON object — no prose, no markdown fences, no commentary before or after it.

Score every "*Score" field from 0-100. Be honest and specific rather than generous; a mediocre script should score in the 40-65 range, not the 80s.

Required JSON shape (all fields required, arrays may be empty but must be present):
{
  "overallScore": number,
  "hookScore": number,
  "retentionScore": number,
  "structureScore": number,
  "clarityScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "retentionRisks": string[],
  "hookSuggestions": string[],
  "titleSuggestions": string[],
  "thumbnailIdeas": string[],
  "ctaSuggestions": string[],
  "improvements": string[],
  "suggestedTitle": string
}

Guidance for each section:
- hookScore: judge only the first ~30 seconds — curiosity, stakes, and whether a viewer has a concrete reason to keep watching.
- structureScore: intro/body/transitions/conclusion and overall logical flow.
- retentionScore: pacing, repetition, curiosity loops, and likely drop-off points across the full script.
- clarityScore: how clear, specific, and valuable the content is for its likely audience.
- retentionRisks: name the specific moments/lines where a viewer is likely to click away.
- titleSuggestions: 3-5 concrete title options based on the actual content.
- thumbnailIdeas: 2-4 concrete visual concepts, described in a sentence each.
- suggestedTitle: a short label for this script (used as the analysis record's title), based on its actual topic — not a generic placeholder.

This is AI-generated analysis, not an objective measurement — write suggestions as opinionated, actionable advice from an experienced editor, not as certainties.`;

export class AnalysisServiceError extends Error {}

/**
 * Sends a script to Groq and returns a validated, structured analysis.
 * Throws AnalysisServiceError on any failure (network, malformed JSON,
 * schema mismatch) so callers can turn it into a friendly error response
 * instead of crashing.
 */
export async function analyzeScript(script: string): Promise<AnalysisResult> {
  const client = getGroqClient();
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  let raw: string | null | undefined;
  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this YouTube script:\n\n"""\n${script}\n"""`,
        },
      ],
    });
    raw = completion.choices[0]?.message?.content;
  } catch (err) {
    throw new AnalysisServiceError(
      `Groq request failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!raw) {
    throw new AnalysisServiceError("The AI provider returned an empty response.");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new AnalysisServiceError("The AI provider returned malformed JSON.");
  }

  const parsed = AnalysisResultSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new AnalysisServiceError(
      `AI response did not match the expected schema: ${parsed.error.message}`
    );
  }

  return parsed.data;
}
