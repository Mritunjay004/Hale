import { describe, it, expect } from "vitest";
import { calculateStreak } from "../src/domain/streaks.js";

describe("calculateStreak", () => {
  it("counts continuous days without gap", () => {
    const completedDates = ["2026-10-08", "2026-10-07", "2026-10-06"];
    const streak = calculateStreak(completedDates, "2026-10-09", 2);

    expect(streak.currentStreakDays).toBe(4); // 6, 7, 8, 9
    expect(streak.longestStreakDays).toBe(4);
    expect(streak.hasGraceDayUsedThisWeek).toBe(false);
    expect(streak.isDayComplete).toBe(true);
  });

  it("applies 1 grace day when 1 day is missed in the week", () => {
    // Missed 2026-10-07, but logged on 6th and 8th
    const completedDates = ["2026-10-08", "2026-10-06"];
    const streak = calculateStreak(completedDates, "2026-10-09", 2);

    expect(streak.currentStreakDays).toBe(4); // 6, (7 grace), 8, 9
    expect(streak.hasGraceDayUsedThisWeek).toBe(true);
  });

  it("breaks streak when 2 consecutive days are missed", () => {
    // Missed 2026-10-06 and 2026-10-07
    const completedDates = ["2026-10-08", "2026-10-05"];
    const streak = calculateStreak(completedDates, "2026-10-09", 2);

    // Only 8th and 9th count (grace day cannot bridge across 2 consecutive missing days)
    expect(streak.currentStreakDays).toBe(2);
  });

  it("handles day 1 new user correctly", () => {
    const streak = calculateStreak([], "2026-10-09", 1);
    expect(streak.currentStreakDays).toBe(0);
    expect(streak.isDayComplete).toBe(false);

    const streakCompleted = calculateStreak([], "2026-10-09", 2);
    expect(streakCompleted.currentStreakDays).toBe(1);
    expect(streakCompleted.isDayComplete).toBe(true);
  });
});
