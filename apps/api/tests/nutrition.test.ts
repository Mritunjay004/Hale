import { describe, it, expect } from "vitest";
import { calculateBMR, calculateTDEE, calculatePlan } from "../src/domain/nutrition.js";

describe("calculateBMR", () => {
  it("computes male BMR using Mifflin-St Jeor formula", () => {
    // Male, 80 kg, 175 cm, 30 years
    // 10*80 + 6.25*175 - 5*30 + 5 = 800 + 1093.75 - 150 + 5 = 1748.75 ≈ 1749
    const bmr = calculateBMR(80, 175, 30, "male");
    expect(bmr).toBe(1749);
  });

  it("computes female BMR using Mifflin-St Jeor formula", () => {
    // Female, 65 kg, 162 cm, 28 years
    // 10*65 + 6.25*162 - 5*28 - 161 = 650 + 1012.5 - 140 - 161 = 1361.5 ≈ 1362
    const bmr = calculateBMR(65, 162, 28, "female");
    expect(bmr).toBe(1362);
  });
});

describe("calculateTDEE", () => {
  it("applies sedentary multiplier (1.2x)", () => {
    const tdee = calculateTDEE(1749, "sedentary");
    expect(tdee).toBe(Math.round(1749 * 1.2)); // 2099
  });

  it("applies moderately active multiplier (1.55x)", () => {
    const tdee = calculateTDEE(1749, "moderately_active");
    expect(tdee).toBe(Math.round(1749 * 1.55)); // 2711
  });
});

describe("calculatePlan", () => {
  const baseFatLossInput = {
    age: 31,
    sex: "male" as const,
    heightCm: 175,
    weightKg: 78,
    activityLevel: "sedentary" as const,
    dietPreference: "none" as const,
    goalType: "fat_loss" as const,
    targetWeightKg: 72,
    targetWeeks: 15,
    notesTags: [],
  };

  it("produces a calorie target within safe bounds", () => {
    const plan = calculatePlan(baseFatLossInput);

    // Should be below TDEE for fat loss
    expect(plan.calorieTarget).toBeLessThan(plan.tdee);
    // Should never go below male floor of 1500
    expect(plan.calorieTarget).toBeGreaterThanOrEqual(1500);
  });

  it("includes 3 focus habits", () => {
    const plan = calculatePlan(baseFatLossInput);
    expect(plan.focusHabits).toHaveLength(3);
    expect(plan.focusHabits[0]!.type).toBe("protein_target");
    expect(plan.focusHabits[1]!.type).toBe("daily_logging");
    expect(plan.focusHabits[2]!.type).toBe("dinner_balance");
  });

  it("generates a whyText explaining the deficit", () => {
    const plan = calculatePlan(baseFatLossInput);
    expect(plan.whyText).toContain("kcal/day");
    expect(plan.whyText.length).toBeGreaterThan(20);
  });

  it("does NOT trigger pushback for a safe rate (0.4 kg/week)", () => {
    const plan = calculatePlan(baseFatLossInput);
    expect(plan.pushback).toBeUndefined();
  });

  it("DOES trigger pushback for an aggressive rate (> 1 kg/week)", () => {
    const aggressiveInput = {
      ...baseFatLossInput,
      targetWeightKg: 68,
      targetWeeks: 4, // Lose 10 kg in 4 weeks = 2.5 kg/week (unsafe)
    };
    const plan = calculatePlan(aggressiveInput);

    expect(plan.pushback).toBeDefined();
    expect(plan.pushback!.triggered).toBe(true);
    expect(plan.pushback!.requestedRateKgPerWeek).toBeGreaterThan(1.0);
    expect(plan.pushback!.safeRateKgPerWeek).toBe(0.4);
    expect(plan.pushback!.proposedWeeks).toBeGreaterThan(4);
  });

  it("enforces the 1200 kcal floor for females", () => {
    const femaleLowInput = {
      ...baseFatLossInput,
      sex: "female" as const,
      weightKg: 50,
      heightCm: 155,
      targetWeightKg: 45,
      targetWeeks: 8,
    };
    const plan = calculatePlan(femaleLowInput);
    expect(plan.calorieTarget).toBeGreaterThanOrEqual(1200);
  });

  it("sets maintenance calories for eat_healthier goal", () => {
    const healthierInput = {
      ...baseFatLossInput,
      goalType: "eat_healthier" as const,
      targetWeightKg: undefined,
      targetWeeks: undefined,
    };
    const plan = calculatePlan(healthierInput);
    // Calories should equal TDEE for eat_healthier
    expect(plan.calorieTarget).toBe(plan.tdee);
    expect(plan.whyText).toContain("nutrient density");
  });

  it("applies a gentle surplus for muscle_gain goal", () => {
    const gainInput = {
      ...baseFatLossInput,
      goalType: "muscle_gain" as const,
      targetWeightKg: undefined,
      targetWeeks: undefined,
    };
    const plan = calculatePlan(gainInput);
    expect(plan.calorieTarget).toBeGreaterThan(plan.tdee);
  });

  it("sets protein target based on goal type and body weight", () => {
    const plan = calculatePlan(baseFatLossInput);
    // Fat loss: 1.6 g/kg × 78 kg = 124.8 ≈ 125
    expect(plan.proteinG).toBe(Math.round(78 * 1.6));
  });

  it("macro calories sum approximately to calorie target", () => {
    const plan = calculatePlan(baseFatLossInput);
    const macroTotal = plan.proteinG * 4 + plan.carbsG * 4 + plan.fatG * 9;
    // Allow 5% tolerance due to rounding
    expect(Math.abs(macroTotal - plan.calorieTarget)).toBeLessThan(plan.calorieTarget * 0.05);
  });
});
