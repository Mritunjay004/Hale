import { z } from "zod";
import { mealRecordSchema } from "./meal.js";
import { focusHabitSchema } from "./profile.js";

export const nextBestActionSchema = z.object({
  id: z.string(),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  title: z.string(),
  subtitle: z.string(),
  ctaText: z.string(),
  actionType: z.enum(["log_meal", "weigh_in", "upload_report", "review_habits", "complete"]),
  suggestedMealType: z.enum(["breakfast", "lunch", "snack", "dinner"]).optional(),
});

export const insightSchema = z.object({
  id: z.string(),
  type: z.string(),
  text: z.string(),
  why: z.string(),
  actionableTip: z.string().optional(),
  shownAt: z.string(),
});

export const streakSummarySchema = z.object({
  currentStreakDays: z.number(),
  longestStreakDays: z.number(),
  hasGraceDayUsedThisWeek: z.boolean(),
  isDayComplete: z.boolean(),
  mealsLoggedCount: z.number(),
});

export const flaggedBiomarkerSnapshotSchema = z.object({
  canonicalKey: z.string(),
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  status: z.enum(["low", "high"]),
  linkedHabitTitle: z.string().optional(),
});

export const todayResponseSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  userFirstName: z.string().default("there"),
  calorieTarget: z.number(),
  proteinTargetG: z.number(),
  carbsTargetG: z.number(),
  fatTargetG: z.number(),

  currentKcal: z.number(),
  currentProteinG: z.number(),
  currentCarbsG: z.number(),
  currentFatG: z.number(),

  remainingKcal: z.number(),
  remainingProteinG: z.number(),

  nextBestAction: nextBestActionSchema,
  insight: insightSchema.nullable().optional(),
  timelineMeals: z.array(mealRecordSchema),
  activeHabits: z.array(focusHabitSchema),
  streak: streakSummarySchema,
  flaggedBiomarkers: z.array(flaggedBiomarkerSnapshotSchema),
  currentWeightKg: z.number().nullable().optional(),
  weightTrendKgPerWeek: z.number().nullable().optional(),
});

export type NextBestAction = z.infer<typeof nextBestActionSchema>;
export type Insight = z.infer<typeof insightSchema>;
export type StreakSummary = z.infer<typeof streakSummarySchema>;
export type FlaggedBiomarkerSnapshot = z.infer<typeof flaggedBiomarkerSnapshotSchema>;
export type TodayResponse = z.infer<typeof todayResponseSchema>;

