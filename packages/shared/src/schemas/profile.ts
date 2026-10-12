import { z } from "zod";

export const sexEnum = z.enum(["male", "female"]);
export const goalTypeEnum = z.enum(["fat_loss", "muscle_gain", "maintenance", "eat_healthier"]);
export const activityLevelEnum = z.enum([
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
]);
export const dietPreferenceEnum = z.enum([
  "none",
  "vegetarian",
  "non_vegetarian",
  "vegan",
  "eggetarian",
]);

export const focusHabitSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  title: z.string(),
  why: z.string(),
  metric: z.string(),
  target: z.number().optional(),
  source: z.enum(["onboarding", "report", "insight"]).default("onboarding"),
  active: z.boolean().default(true),
});

export const planRequestSchema = z.object({
  age: z.number().int().min(14).max(100),
  sex: sexEnum,
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(35).max(300),
  activityLevel: activityLevelEnum,
  dietPreference: dietPreferenceEnum.default("none"),
  goalType: goalTypeEnum,
  targetWeightKg: z.number().nullable().optional(),
  targetWeeks: z.number().nullable().optional(),
  notesTags: z.array(z.string()).default([]),
});

export const pushbackSchema = z.object({
  triggered: z.boolean(),
  reason: z.string(),
  requestedRateKgPerWeek: z.number(),
  safeRateKgPerWeek: z.number(),
  proposedTargetDate: z.string(),
  proposedWeeks: z.number(),
});

export const planResponseSchema = z.object({
  bmr: z.number(),
  tdee: z.number(),
  calorieTarget: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  whyText: z.string(),
  focusHabits: z.array(focusHabitSchema),
  pushback: pushbackSchema.optional(),
});
export const notificationPrefsSchema = z.object({
  smartMealReminders: z.boolean().default(true),
  eveningWrapUp: z.boolean().default(true),
  weeklyReview: z.boolean().default(true),
  quietHoursStart: z.string().default("22:00"),
  quietHoursEnd: z.string().default("07:00"),
});

export const profileSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  age: z.number(),
  sex: sexEnum,
  heightCm: z.number(),
  weightKg: z.number(),
  activityLevel: activityLevelEnum,
  dietPreference: dietPreferenceEnum,
  goalType: goalTypeEnum,
  targetWeightKg: z.number().nullable().optional(),
  targetDate: z.string().nullable().optional(),
  calorieTarget: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  notesTags: z.array(z.string()),
  focusHabits: z.array(focusHabitSchema),
  notificationPrefs: notificationPrefsSchema.default({}),
});

export type Sex = z.infer<typeof sexEnum>;
export type GoalType = z.infer<typeof goalTypeEnum>;
export type ActivityLevel = z.infer<typeof activityLevelEnum>;
export type DietPreference = z.infer<typeof dietPreferenceEnum>;
export type FocusHabit = z.infer<typeof focusHabitSchema>;
export type PlanRequestInput = z.infer<typeof planRequestSchema>;
export type PlanResponse = z.infer<typeof planResponseSchema>;
export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Pushback = z.infer<typeof pushbackSchema>;

