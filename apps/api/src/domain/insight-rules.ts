/**
 * Pure Domain Insight Rules Engine
 * Generates structured insight candidates with facts, priority, and cooldowns.
 * Only the winning candidate is sent to the LLM for phrasing, preventing hallucination.
 */

export interface InsightCandidate {
  type: string;
  priority: number; // Higher number = higher priority
  facts: Record<string, unknown>;
  defaultText: string;
  defaultWhy: string;
  actionableTip: string;
}

export interface InsightContext {
  calorieTarget: number;
  proteinTargetG: number;
  consumedKcalToday: number;
  consumedProteinTodayG: number;
  hourOfDay: number; // 0 - 23
  streakDays: number;
  flaggedBiomarkersCount: number;
  recentLoggedMealCount: number;
}

export function evaluateInsightRules(ctx: InsightContext): InsightCandidate[] {
  const candidates: InsightCandidate[] = [];

  // Rule 1: Afternoon / Evening Protein Shortfall
  const proteinShortfall = ctx.proteinTargetG - ctx.consumedProteinTodayG;
  if (ctx.hourOfDay >= 13 && proteinShortfall > 25) {
    candidates.push({
      type: "protein_shortfall",
      priority: 90,
      facts: {
        proteinShortfallG: proteinShortfall,
        targetG: ctx.proteinTargetG,
        currentG: ctx.consumedProteinTodayG,
        hourOfDay: ctx.hourOfDay,
      },
      defaultText: `You have ${proteinShortfall}g protein left to reach your ${ctx.proteinTargetG}g goal today.`,
      defaultWhy: "Hitting your protein floor protects lean muscle while staying in your caloric deficit.",
      actionableTip: "Add Greek yogurt, paneer, tofu, or sprouts to your upcoming meal.",
    });
  }

  // Rule 2: Near Calorie Target with Unlogged Meals
  const remainingKcal = ctx.calorieTarget - ctx.consumedKcalToday;
  if (ctx.hourOfDay < 18 && remainingKcal < 300 && ctx.recentLoggedMealCount < 2) {
    candidates.push({
      type: "calorie_pacing",
      priority: 80,
      facts: {
        remainingKcal,
        consumedKcal: ctx.consumedKcalToday,
        targetKcal: ctx.calorieTarget,
      },
      defaultText: `You have consumed ${ctx.consumedKcalToday} of your ${ctx.calorieTarget} kcal daily target.`,
      defaultWhy: "Keeping afternoon snacks light leaves comfortable headroom for a satiating dinner.",
      actionableTip: "A high-volume cucumber or vegetable soup provides great satiety without excess calories.",
    });
  }

  // Rule 3: Streak Milestone Celebration
  if (ctx.streakDays > 0 && ctx.streakDays % 3 === 0) {
    candidates.push({
      type: "streak_momentum",
      priority: 70,
      facts: {
        streakDays: ctx.streakDays,
      },
      defaultText: `You're on a ${ctx.streakDays}-day logging streak!`,
      defaultWhy: "Consistency in tracking is the single strongest predictor of 90-day body composition success.",
      actionableTip: "Take 10 seconds to log today's remaining meal to lock in day " + (ctx.streakDays + 1) + ".",
    });
  }

  // Rule 4: Biomarker Habit Link Reminder
  if (ctx.flaggedBiomarkersCount > 0) {
    candidates.push({
      type: "biomarker_alignment",
      priority: 60,
      facts: {
        flaggedCount: ctx.flaggedBiomarkersCount,
      },
      defaultText: "Your daily focus habits are aligned with your uploaded lab report.",
      defaultWhy: "Small daily swaps compound over 90 days to visibly shift blood biomarkers.",
      actionableTip: "Check your active habits on Today to see today's micro-target.",
    });
  }

  // Default fallback candidate
  if (candidates.length === 0) {
    candidates.push({
      type: "general_consistency",
      priority: 10,
      facts: {},
      defaultText: "Focus on one high-protein, nutrient-dense choice today.",
      defaultWhy: "Sustainable progress comes from repeatable, low-friction habits.",
      actionableTip: "Log meals right after eating while portions are fresh in memory.",
    });
  }

  return candidates.sort((a, b) => b.priority - a.priority);
}

