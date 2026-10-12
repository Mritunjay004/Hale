import { describe, it, expect } from "vitest";
import { normalizeParsedMealJson } from "../src/ai/gemini-provider.js";

describe("normalizeParsedMealJson", () => {
  it("normalizes imperfect model output into strict parsedMealSchema", () => {
    // Simulated output that previously failed Zod validation
    const modelOutput = JSON.stringify({
      food_name: "Kaju Katli",
      items: [
        {
          name: "Kaju Katli",
          quantity: 3,
          unit: "pieces",
          calories: 165,
          protein: 3.6,
          carbs: 24,
          fat: 7.5,
        },
      ],
    });

    const normalized = normalizeParsedMealJson(modelOutput, "snack");

    expect(normalized.mealType).toBe("snack");
    expect(normalized.items).toHaveLength(1);
    expect(normalized.items[0]!.name).toBe("Kaju Katli");
    expect(normalized.items[0]!.quantity).toBe(3);
    expect(normalized.items[0]!.kcal).toBe(165);
    expect(normalized.items[0]!.proteinG).toBe(3.6);
    expect(normalized.items[0]!.carbsG).toBe(24);
    expect(normalized.items[0]!.fatG).toBe(7.5);
    expect(normalized.totalKcal).toBe(165);
    expect(normalized.proteinG).toBe(3.6);
    expect(normalized.carbsG).toBe(24);
    expect(normalized.fatG).toBe(7.5);
    expect(normalized.isFood).toBe(true);
  });

  it("handles markdown code fences properly", () => {
    const rawMarkdown = "```json\n{\"mealType\": \"lunch\", \"items\": [{\"name\": \"Dal\", \"quantity\": 1, \"unit\": \"bowl\", \"kcal\": 150, \"proteinG\": 9, \"carbsG\": 20, \"fatG\": 3}], \"totalKcal\": 150, \"proteinG\": 9, \"carbsG\": 20, \"fatG\": 3}\n```";
    const normalized = normalizeParsedMealJson(rawMarkdown);
    expect(normalized.mealType).toBe("lunch");
    expect(normalized.items[0]!.name).toBe("Dal");
    expect(normalized.totalKcal).toBe(150);
  });

  it("calculates totals automatically if root totals are missing", () => {
    const outputWithoutTotals = {
      mealType: "snack",
      items: [
        { name: "Almonds", quantity: 10, unit: "nuts", kcal: 70, proteinG: 2.5, carbsG: 2.5, fatG: 6 },
        { name: "Walnuts", quantity: 4, unit: "halves", kcal: 50, proteinG: 1.5, carbsG: 1, fatG: 5 },
      ],
    };

    const normalized = normalizeParsedMealJson(outputWithoutTotals);
    expect(normalized.totalKcal).toBe(120);
    expect(normalized.proteinG).toBe(4);
    expect(normalized.carbsG).toBe(3.5);
    expect(normalized.fatG).toBe(11);
  });
});

