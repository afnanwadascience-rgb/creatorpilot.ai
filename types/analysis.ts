import { z } from "zod";

// Structured shape the AI must return. Every list field defaults to an
// empty array if the model omits it, and safeParse is used at the call site
// so a malformed AI response never crashes the request - see
// services/analysis.service.ts.
export const analysisResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  hookScore: z.number().min(0).max(100),
  retentionScore: z.number().min(0).max(100),
  structureScore: z.number().min(0).max(100),
  clarityScore: z.number().min(0).max(100),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  retentionRisks: z.array(z.string()).default([]),
  hookSuggestions: z.array(z.string()).default([]),
  titleSuggestions: z.array(z.string()).default([]),
  thumbnailIdeas: z.array(z.string()).default([]),
  ctaSuggestions: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  suggestedTitle: z.string().default("Untitled Script"),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

// Request body for POST /api/analysis
export const createAnalysisSchema = z.object({
  script: z
    .string()
    .trim()
    .min(50, "Script must be at least 50 characters so there's enough to analyze.")
    .max(20000, "Script is too long. Please keep it under 20,000 characters."),
});

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;

// Shape returned to the client for a saved analysis record.
export interface AnalysisRecord {
  id: string;
  title: string;
  script: string;
  createdAt: string;
  overallScore: number;
  hookScore: number;
  retentionScore: number;
  structureScore: number;
  clarityScore: number;
  result: AnalysisResult;
}
