import { z } from "zod";

export const AnalyzeRequestSchema = z.object({
  script: z
    .string()
    .min(1, "Script is required.")
    .max(100000, "Script is too long."),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const AnalysisResultSchema = z.object({
  suggestedTitle: z.string(),

  overallScore: z.number(),
  hookScore: z.number(),
  retentionScore: z.number(),
  structureScore: z.number(),
  clarityScore: z.number(),

  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  retentionRisks: z.array(z.string()),
  hookSuggestions: z.array(z.string()),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
