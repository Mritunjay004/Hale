import { describe, it, expect } from "vitest";
import { computeNextBestAction } from "../src/modules/today/routes.js";

describe("computeNextBestAction", () => {
  it("never suggests 'Log Dinner' if dinner is already logged; prompts missing lunch first", () => {
    // User scenario: at 23:00, dinner is logged (2 rotis, yellow dal)
    // Protein gap: 163g (13g / 176g), lunch was not logged
    const result = computeNextBestAction({
      hourOfDay: 23,
      todayMeals: [{ mealType: "dinner" }],
      currentProteinG: 13,
      targetProteinG: 176,
      isDayComplete: false,
    });

    expect(result.suggestedMealType).not.toBe("dinner");
    expect(result.ctaText).not.toBe("Log Dinner");
    expect(result.suggestedMealType).toBe("lunch");
    expect(result.ctaText).toBe("Log Lunch");
  });

  it("suggests 'Log Dinner' in the evening if dinner is NOT logged", () => {
    const result = computeNextBestAction({
      hourOfDay: 19,
      todayMeals: [{ mealType: "lunch" }],
      currentProteinG: 40,
      targetProteinG: 150,
      isDayComplete: false,
    });

    expect(result.suggestedMealType).toBe("dinner");
    expect(result.ctaText).toBe("Log Dinner");
  });

  it("never suggests 'Log Lunch' if lunch is already logged", () => {
    const result = computeNextBestAction({
      hourOfDay: 13,
      todayMeals: [{ mealType: "breakfast" }, { mealType: "lunch" }],
      currentProteinG: 60,
      targetProteinG: 140,
      isDayComplete: true,
    });

    expect(result.suggestedMealType).not.toBe("lunch");
    expect(result.ctaText).not.toBe("Log Lunch");
  });

  it("prompts to backfill missing breakfast when lunch and dinner are logged", () => {
    const result = computeNextBestAction({
      hourOfDay: 21,
      todayMeals: [{ mealType: "lunch" }, { mealType: "dinner" }],
      currentProteinG: 100,
      targetProteinG: 150,
      isDayComplete: true,
    });

    expect(result.suggestedMealType).toBe("breakfast");
    expect(result.ctaText).toBe("Log Breakfast");
  });

  it("marks day complete when all 3 main meals are logged in the evening", () => {
    const result = computeNextBestAction({
      hourOfDay: 21,
      todayMeals: [{ mealType: "breakfast" }, { mealType: "lunch" }, { mealType: "dinner" }],
      currentProteinG: 140,
      targetProteinG: 150,
      isDayComplete: true,
    });

    expect(result.id).toBe("day_complete");
    expect(result.actionType).toBe("complete");
    expect(result.ctaText).toBe("View Summary");
  });

  it("does not prematurely mark day complete if user logged two dinners but missed lunch and breakfast", () => {
    const result = computeNextBestAction({
      hourOfDay: 23,
      todayMeals: [{ mealType: "dinner" }, { mealType: "dinner" }],
      currentProteinG: 26,
      targetProteinG: 176,
      isDayComplete: true,
    });

    expect(result.id).not.toBe("day_complete");
    expect(result.suggestedMealType).toBe("lunch");
    expect(result.ctaText).toBe("Log Lunch");
  });
});

