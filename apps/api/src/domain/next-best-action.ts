import type { NextBestAction } from "@hale/shared";

export function computeNextBestAction(params: {
  hourOfDay: number;
  todayMeals: Array<{ mealType: string; isSkipped?: boolean }>;
  currentProteinG: number;
  targetProteinG: number;
  isDayComplete: boolean;
}): NextBestAction {
  const { hourOfDay, todayMeals, currentProteinG, targetProteinG } = params;

  const hasBreakfast = todayMeals.some((m) => m.mealType === "breakfast");
  const hasLunch = todayMeals.some((m) => m.mealType === "lunch");
  const hasDinner = todayMeals.some((m) => m.mealType === "dinner");
  const allMainMealsLogged = hasBreakfast && hasLunch && hasDinner;
  const proteinGap = Math.max(0, targetProteinG - currentProteinG);

  // 1. All main meals logged (Breakfast + Lunch + Dinner are in!)
  if (allMainMealsLogged) {
    if (hourOfDay >= 21 || hourOfDay < 5 || proteinGap <= 15) {
      return {
        id: "day_complete",
        priority: "P3",
        title: "Day complete!",
        subtitle: "Great job logging your meals today. Rest well tonight.",
        ctaText: "View Summary",
        actionType: "complete",
      };
    }

    if (proteinGap > 15) {
      return {
        id: "protein_gap_snack",
        priority: "P2",
        title: `${proteinGap}g protein to go`,
        subtitle: "All main meals logged! A light protein snack or Greek yogurt will help close the gap.",
        ctaText: "Log Snack",
        actionType: "log_meal",
        suggestedMealType: "snack",
      };
    }

    return {
      id: "all_meals_logged",
      priority: "P3",
      title: "All main meals logged",
      subtitle: "You've recorded breakfast, lunch, and dinner. Log a snack if you have late-night fuel.",
      ctaText: "Log Snack",
      actionType: "log_meal",
      suggestedMealType: "snack",
    };
  }

  // 2. Dinner is logged, but earlier main meals are missing!
  if (hasDinner) {
    // Missing lunch is highest priority to backfill
    if (!hasLunch) {
      return {
        id: "backfill_lunch",
        priority: "P1",
        title: "Lunch not logged",
        subtitle: "Dinner is logged, but lunch is missing. Log lunch to complete your food diary today.",
        ctaText: "Log Lunch",
        actionType: "log_meal",
        suggestedMealType: "lunch",
      };
    }

    // Missing breakfast is next priority to backfill
    if (!hasBreakfast) {
      return {
        id: "backfill_breakfast",
        priority: "P1",
        title: "Breakfast not logged",
        subtitle: "Lunch and dinner are logged, but breakfast is missing. Backfill your morning meal.",
        ctaText: "Log Breakfast",
        actionType: "log_meal",
        suggestedMealType: "breakfast",
      };
    }

    // Both lunch and breakfast accounted for (safety fallback)
    return {
      id: "evening_snack",
      priority: "P3",
      title: "Dinner logged",
      subtitle: "Having an evening tea or healthy bite? Log it to keep your food diary accurate.",
      ctaText: "Log Snack",
      actionType: "log_meal",
      suggestedMealType: "snack",
    };
  }

  // 3. Dinner is NOT logged, and it's Evening / Night (hourOfDay >= 18)
  if (hourOfDay >= 18 && !hasDinner) {
    if (proteinGap > 25) {
      return {
        id: "protein_gap_dinner",
        priority: "P1",
        title: `${proteinGap}g protein to go`,
        subtitle: "Include Greek yogurt, paneer, eggs, chicken, or tofu with dinner to close the gap.",
        ctaText: "Log Dinner",
        actionType: "log_meal",
        suggestedMealType: "dinner",
      };
    }
    return {
      id: "log_dinner",
      priority: "P1",
      title: "Dinner time",
      subtitle: "Speak or snap your evening meal to keep your momentum going.",
      ctaText: "Log Dinner",
      actionType: "log_meal",
      suggestedMealType: "dinner",
    };
  }

  // 4. Afternoon / Lunch Time (11am - 6pm)
  if (hourOfDay >= 11 && hourOfDay < 18) {
    if (!hasLunch) {
      if (proteinGap > 25) {
        return {
          id: "protein_gap_lunch",
          priority: "P1",
          title: `${proteinGap}g protein to go`,
          subtitle: "Add high-protein items like dal, eggs, paneer, or chicken with lunch.",
          ctaText: "Log Lunch",
          actionType: "log_meal",
          suggestedMealType: "lunch",
        };
      }
      return {
        id: "log_lunch",
        priority: "P1",
        title: "Lunch not logged yet",
        subtitle: "You usually eat around now. Speak or snap your lunch in 10s.",
        ctaText: "Log Lunch",
        actionType: "log_meal",
        suggestedMealType: "lunch",
      };
    } else {
      // Lunch is already logged! Check if breakfast was missed
      if (!hasBreakfast) {
        return {
          id: "backfill_breakfast_afternoon",
          priority: "P2",
          title: "Breakfast not logged",
          subtitle: "Lunch is recorded, but breakfast isn't. Backfill your morning meal in seconds.",
          ctaText: "Log Breakfast",
          actionType: "log_meal",
          suggestedMealType: "breakfast",
        };
      }

      // Both breakfast and lunch logged: prompt snack or hydration
      if (hourOfDay >= 15) {
        return {
          id: "log_afternoon_snack",
          priority: "P2",
          title: "Afternoon fuel",
          subtitle: "Having tea, fruit, or a light snack? Log it to keep your food diary accurate.",
          ctaText: "Log Snack",
          actionType: "log_meal",
          suggestedMealType: "snack",
        };
      }
      return {
        id: "lunch_logged",
        priority: "P3",
        title: "Lunch logged!",
        subtitle: "Stay hydrated this afternoon. Dinner recommendations will appear this evening.",
        ctaText: "Log Snack",
        actionType: "log_meal",
        suggestedMealType: "snack",
      };
    }
  }

  // 5. Morning (Before 11am)
  if (!hasBreakfast) {
    return {
      id: "log_first_meal",
      priority: "P1",
      title: "Start your day",
      subtitle: "Log your first meal or beverage to kickstart today's tracking.",
      ctaText: "Log Breakfast",
      actionType: "log_meal",
      suggestedMealType: "breakfast",
    };
  }

  // Morning and breakfast is logged
  return {
    id: "log_morning_snack",
    priority: "P3",
    title: "Breakfast logged!",
    subtitle: "Great start! Log any mid-morning fruit, tea, or hydration.",
    ctaText: "Log Snack",
    actionType: "log_meal",
    suggestedMealType: "snack",
  };
}

