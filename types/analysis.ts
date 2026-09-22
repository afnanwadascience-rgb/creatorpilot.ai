import { z } from "zod";

export const AnalyzeRequestSchema = z.object({
  script: z
    .string()
    .min(1, "Script is required.")
    .max(100000, "Script is too long."),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export interface AnalysisResult {
  suggestedTitle: string;
  overallScore: number;
  hookScore: number;
  retentionScore: number;
  structureScore: number;
  clarityScore: number;
  [key: string]: unknown;
}
