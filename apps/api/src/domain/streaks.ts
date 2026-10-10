import { HABIT_DEFAULTS, type StreakSummary } from "@hale/shared";

/**
 * Pure domain streak calculator.
 * Enforces habit momentum with empathy: allows 1 grace/rest day per rolling 7 days
 * without resetting the active streak.
 */
export function calculateStreak(
  completedDates: readonly string[], // Format: YYYY-MM-DD (sorted descending or ascending)
  todayDate: string, // Format: YYYY-MM-DD
  todayMealCount: number
): StreakSummary {
  const dateSet = new Set(completedDates);
  const isDayComplete =
    todayMealCount >= HABIT_DEFAULTS.MIN_MEALS_FOR_DAY_COMPLETE || dateSet.has(todayDate);

  if (isDayComplete) {
    dateSet.add(todayDate);
  }

  // Helper to parse date string to timestamp at midnight
  const parseDate = (dStr: string) => new Date(`${dStr}T00:00:00Z`).getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  let currentStreak = 0;
  let graceDayUsedThisWeek = false;

  // Walk backward day by day starting from today or yesterday
  const todayMs = parseDate(todayDate);
  let checkMs = isDayComplete ? todayMs : todayMs - ONE_DAY_MS;

  while (true) {
    const dateStr = new Date(checkMs).toISOString().split("T")[0]!;
    if (dateSet.has(dateStr)) {
      currentStreak++;
      checkMs -= ONE_DAY_MS;
    } else {
      // Check if earlier day (checkMs - ONE_DAY_MS) is completed, allowing a 1-day grace bridge
      const earlierDateStr = new Date(checkMs - ONE_DAY_MS).toISOString().split("T")[0]!;
      if (!graceDayUsedThisWeek && dateSet.has(earlierDateStr)) {
        graceDayUsedThisWeek = true;
        currentStreak++; // Grace day counts toward habit streak
        checkMs -= ONE_DAY_MS;
      } else {
        // Streak ends here
        break;
      }
    }
  }

  // Calculate longest historical streak
  let longestStreak = currentStreak;
  // Sort unique dates ascending
  const sortedDates = Array.from(dateSet).sort();
  let tempStreak = 0;
  let lastMs = 0;

  for (const dStr of sortedDates) {
    const ms = parseDate(dStr);
    if (lastMs === 0 || ms - lastMs === ONE_DAY_MS) {
      tempStreak++;
    } else if (ms - lastMs === 2 * ONE_DAY_MS) {
      // 1-day gap allowed via grace
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    lastMs = ms;
  }

  return {
    currentStreakDays: currentStreak,
    longestStreakDays: longestStreak,
    hasGraceDayUsedThisWeek: graceDayUsedThisWeek,
    isDayComplete,
    mealsLoggedCount: todayMealCount,
  };
}

