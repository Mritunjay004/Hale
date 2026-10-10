import { z } from "zod";

export const biomarkerStatusEnum = z.enum(["low", "normal", "high", "unknown"]);

export const extractedParameterSchema = z.object({
  id: z.string().optional(),
  canonicalKey: z.string().nullable().optional(),
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  refLow: z.number().nullable().optional(),
  refHigh: z.number().nullable().optional(),
  status: biomarkerStatusEnum,
  confidence: z.enum(["high", "medium", "low"]).default("high"),
  needsReview: z.boolean().default(false),
});

export const extractedReportResponseSchema = z.object({
  reportDate: z.string(),
  labName: z.string().optional(),
  parameters: z.array(extractedParameterSchema),
  rawSummary: z.string().optional(),
  goalLinkedSuggestions: z.array(
    z.object({
      parameterKey: z.string(),
      parameterName: z.string(),
      habitTitle: z.string(),
      why: z.string(),
      metric: z.string(),
    })
  ),
});

export const saveReportSchema = z.object({
  reportDate: z.string(),
  label: z.string(),
  parameters: z.array(extractedParameterSchema),
  acceptedHabitKeys: z.array(z.string()).default([]),
});

export const trendDataPointSchema = z.object({
  date: z.string(),
  value: z.number(),
  unit: z.string(),
  status: biomarkerStatusEnum,
  reportId: z.string(),
});

export const parameterTrendResponseSchema = z.object({
  canonicalKey: z.string(),
  name: z.string(),
  standardUnit: z.string(),
  explanation: z.string(),
  refLow: z.number(),
  refHigh: z.number(),
  history: z.array(trendDataPointSchema),
  activeLinkedHabit: z
    .object({
      title: z.string(),
      why: z.string(),
    })
    .nullable()
    .optional(),
});

export type BiomarkerStatusType = z.infer<typeof biomarkerStatusEnum>;
export type ExtractedParameter = z.infer<typeof extractedParameterSchema>;
export type ExtractedReportResponse = z.infer<typeof extractedReportResponseSchema>;
export type SaveReportInput = z.infer<typeof saveReportSchema>;
export type ParameterTrendResponse = z.infer<typeof parameterTrendResponseSchema>;

