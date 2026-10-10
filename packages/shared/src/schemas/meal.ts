import { z } from "zod";

export const mealTypeEnum = z.enum(["breakfast", "lunch", "snack", "dinner"]);
export const mealSourceEnum = z.enum(["voice", "camera", "text", "chat", "manual"]);
export const confidenceEnum = z.enum(["high", "medium", "low"]);

export const alternativeOptionSchema = z.object({
  name: z.string(),
  kcal: z.number(),
  proteinG: z.number(),
});

export const mealItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  kcal: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  confidence: confidenceEnum.default("high"),
  alternatives: z.array(alternativeOptionSchema).nullish(),
});

export const parsedMealSchema = z.object({
  mealType: mealTypeEnum,
  items: z.array(mealItemSchema),
  totalKcal: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  confidence: confidenceEnum.default("high"),
  clarifyingQuestion: z.string().nullish(),
  isFood: z.boolean().default(true),
  isSkipped: z.boolean().default(false),
  impactSummary: z.string().nullish(),
});

export const parseMealRequestSchema = z.object({
  text: z.string().optional(),
  mealType: mealTypeEnum.optional(),
  clientTimestamp: z.string().optional(),
});

export const saveMealSchema = z.object({
  mealType: mealTypeEnum,
  source: mealSourceEnum,
  loggedAt: z.string().optional(),
  rawInput: z.string().optional(),
  items: z.array(mealItemSchema),
  totalKcal: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  confidence: confidenceEnum.default("high"),
  isSkipped: z.boolean().default(false),
  idempotencyKey: z.string().uuid(),
});

export const mealRecordSchema = saveMealSchema.extend({
  id: z.string(),
  userId: z.string(),
  createdAt: z.string(),
});

export type MealType = z.infer<typeof mealTypeEnum>;
export type MealSource = z.infer<typeof mealSourceEnum>;
export type Confidence = z.infer<typeof confidenceEnum>;
export type MealItem = z.infer<typeof mealItemSchema>;
export type ParsedMeal = z.infer<typeof parsedMealSchema>;
export type ParseMealRequest = z.infer<typeof parseMealRequestSchema>;
export type SaveMealInput = z.infer<typeof saveMealSchema>;
export type MealRecord = z.infer<typeof mealRecordSchema>;

