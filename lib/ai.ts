import Groq from "groq-sdk";

/**
 * Thin wrapper around the AI provider. All AI calls happen server-side only
 * - GROQ_API_KEY is never referenced from client components. If your
 * project already has a working AI service, swap the implementation of
 * runScriptAnalysisPrompt() to call it instead of Groq; nothing outside
 * this file needs to change.
 */

let client: Groq | null = null;

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set. Add it to your environment (.env).");
  }
  if (!client) {
    client = new Groq({ apiKey });
  }
  return client;
}

// Current production Groq model as of this writing. Override via env if
// your account has access to a different model you'd rather use, so this
// never has to be a hardcoded assumption baked into the code.
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function runScriptAnalysisPrompt(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const groq = getClient();

  const completion = await groq.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.4,
    max_tokens: 2000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("The AI provider returned an empty response.");
  }
  return content;
}
