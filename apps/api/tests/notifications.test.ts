import { describe, it, expect } from "vitest";
import { notificationPrefsSchema } from "@hale/shared";
import { computeNextBestAction } from "../src/modules/today/routes.js";

describe("Notification Preferences Schema", () => {
  it("applies sensible defaults when empty object is passed", () => {
    const prefs = notificationPrefsSchema.parse({});
    expect(prefs.smartMealReminders).toBe(true);
    expect(prefs.eveningWrapUp).toBe(true);
    expect(prefs.weeklyReview).toBe(true);
    expect(prefs.quietHoursStart).toBe("22:00");
    expect(prefs.quietHoursEnd).toBe("07:00");
  });

  it("allows partial preference overrides", () => {
    const partial = notificationPrefsSchema.partial().parse({
      smartMealReminders: false,
      quietHoursStart: "23:00",
    });
    expect(partial.smartMealReminders).toBe(false);
    expect(partial.quietHoursStart).toBe("23:00");
    expect(partial.eveningWrapUp).toBeUndefined();
  });
});

describe("Unlogged Meal Next Best Action and Nudges", () => {
  it("suggests breakfast in the morning if breakfast is missing", () => {
    const nba = computeNextBestAction({
      hourOfDay: 9,
      todayMeals: [],
      currentProteinG: 0,
      targetProteinG: 120,
      isDayComplete: false,
    });

    expect(nba.suggestedMealType).toBe("breakfast");
    expect(nba.actionType).toBe("log_meal");
    expect(nba.priority).toBe("P1");
  });

  it("suggests lunch in the afternoon if lunch is missing", () => {
    const nba = computeNextBestAction({
      hourOfDay: 13,
      todayMeals: [{ mealType: "breakfast" }],
      currentProteinG: 30,
      targetProteinG: 120,
      isDayComplete: false,
    });

    expect(nba.suggestedMealType).toBe("lunch");
    expect(nba.actionType).toBe("log_meal");
    expect(nba.priority).toBe("P1");
  });

  it("suggests dinner in the evening if dinner is missing", () => {
    const nba = computeNextBestAction({
      hourOfDay: 19,
      todayMeals: [{ mealType: "breakfast" }, { mealType: "lunch" }],
      currentProteinG: 70,
      targetProteinG: 120,
      isDayComplete: false,
    });

    expect(nba.suggestedMealType).toBe("dinner");
    expect(nba.actionType).toBe("log_meal");
    expect(nba.priority).toBe("P1");
  });

  it("suggests backfilling missing lunch if dinner is logged first", () => {
    const nba = computeNextBestAction({
      hourOfDay: 20,
      todayMeals: [{ mealType: "dinner" }],
      currentProteinG: 45,
      targetProteinG: 120,
      isDayComplete: false,
    });

    expect(nba.suggestedMealType).toBe("lunch");
    expect(nba.title).toContain("Lunch not logged");
  });

  it("marks day complete when all 3 main meals are recorded", () => {
    const nba = computeNextBestAction({
      hourOfDay: 21,
      todayMeals: [
        { mealType: "breakfast" },
        { mealType: "lunch" },
        { mealType: "dinner" },
      ],
      currentProteinG: 115,
      targetProteinG: 120,
      isDayComplete: true,
    });

    expect(nba.id).toBe("day_complete");
    expect(nba.actionType).toBe("complete");
    expect(nba.ctaText).toBe("View Summary");
  });
});

