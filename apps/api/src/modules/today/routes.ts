import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../../infra/auth.js";
import { db } from "../../infra/db/connection.js";
import { profiles, meals, focusHabits, reports, reportParameters, weightEntries, mealItems } from "../../infra/db/schema.js";
import { eq, and, gte, lte, desc, inArray } from "drizzle-orm";
import { evaluateInsightRules } from "../../domain/insight-rules.js";
import { calculateStreak } from "../../domain/streaks.js";
import { NotFoundError } from "../../infra/errors.js";
import type { NextBestAction, FlaggedBiomarkerSnapshot } from "@hale/shared";

export async function todayRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authMiddleware);

  /**
   * GET /v1/today
   * Single aggregated payload for the home screen.
   */
  app.get("/today", async (request, reply) => {
    const userId = request.userId;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]!;
    const hourOfDay = now.getHours();

    // Fetch profile
    const profileResult = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (profileResult.length === 0) {
      throw new NotFoundError("Profile (please complete onboarding)");
    }
    const profile = profileResult[0]!;

    // Fetch today's meals
    const queryDate = (request.query as { date?: string }).date;
    const localStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const localEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const dayStart = queryDate ? new Date(`${queryDate}T00:00:00.000Z`) : localStart;
    const dayEnd = queryDate ? new Date(`${queryDate}T23:59:59.999Z`) : localEnd;
    // Auto-clean any corrupt phantom chat meals (0 kcal, non-skipped chat inputs)
    await db
      .delete(meals)
      .where(
        and(
          eq(meals.userId, userId),
          eq(meals.source, "chat"),
          eq(meals.totalKcal, 0),
          eq(meals.isSkipped, false)
        )
      );

    const todayMeals = await db
      .select()
      .from(meals)
      .where(
        and(eq(meals.userId, userId), gte(meals.loggedAt, dayStart), lte(meals.loggedAt, dayEnd))
      );

    // Sum today's totals and collect items
    let currentKcal = 0;
    let currentProteinG = 0;
    let currentCarbsG = 0;
    let currentFatG = 0;
    for (const meal of todayMeals) {
      currentKcal += meal.totalKcal;
      currentProteinG += meal.proteinG;
      currentCarbsG += meal.carbsG;
      currentFatG += meal.fatG;
    }

    const mealIds = todayMeals.map((m) => m.id);
    const itemsByMealId = new Map<string, Array<{
      id?: string;
      name: string;
      quantity: number;
      unit: string;
      kcal: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
      confidence: "high" | "medium" | "low";
    }>>();

    if (mealIds.length > 0) {
      const dbItems = await db
        .select()
        .from(mealItems)
        .where(inArray(mealItems.mealId, mealIds));
      for (const item of dbItems) {
        const arr = itemsByMealId.get(item.mealId) ?? [];
        arr.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          kcal: item.kcal,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG,
          confidence: (item.confidence as "high" | "medium" | "low") ?? "high",
        });
        itemsByMealId.set(item.mealId, arr);
      }
    }

    // Fetch habits (prioritize report biomarker habits, then protein target, then daily logging)
    const habits = await db
      .select()
      .from(focusHabits)
      .where(and(eq(focusHabits.userId, userId), eq(focusHabits.active, true)));

    habits.sort((a, b) => {
      const getPriority = (h: typeof a) => {
        if (h.source === "report") return 3;
        if (h.type === "protein_target") return 2;
        if (h.type === "daily_logging") return 1;
        return 0;
      };
      return getPriority(b) - getPriority(a);
    });

    // Compute streak from recent meal-complete days
    const recentMeals = await db
      .select({ loggedAt: meals.loggedAt })
      .from(meals)
      .where(eq(meals.userId, userId))
      .orderBy(desc(meals.loggedAt));

    // Group by date, count if >=2 meals that day
    const dayCountMap = new Map<string, number>();
    for (const m of recentMeals) {
      const dateStr = m.loggedAt.toISOString().split("T")[0]!;
      dayCountMap.set(dateStr, (dayCountMap.get(dateStr) ?? 0) + 1);
    }
    const completedDates = Array.from(dayCountMap.entries())
      .filter(([, count]) => count >= 2)
      .map(([d]) => d);

    const streak = calculateStreak(completedDates, todayStr, todayMeals.length);

    // Flagged biomarkers (from latest report)
    const flaggedBiomarkers: FlaggedBiomarkerSnapshot[] = [];
    const latestReport = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.createdAt))
      .limit(1);

    if (latestReport.length > 0) {
      const params = await db
        .select()
        .from(reportParameters)
        .where(eq(reportParameters.reportId, latestReport[0]!.id));

      for (const p of params) {
        if (p.status === "high" || p.status === "low") {
          flaggedBiomarkers.push({
            canonicalKey: p.canonicalKey ?? p.name.toLowerCase().replace(/\s+/g, "_"),
            name: p.name,
            value: p.value,
            unit: p.unit,
            status: p.status,
          });
        }
      }
    }

    // Insight engine
    const insightCandidates = evaluateInsightRules({
      calorieTarget: profile.calorieTarget,
      proteinTargetG: profile.proteinG,
      consumedKcalToday: currentKcal,
      consumedProteinTodayG: currentProteinG,
      hourOfDay,
      streakDays: streak.currentStreakDays,
      flaggedBiomarkersCount: flaggedBiomarkers.length,
      recentLoggedMealCount: todayMeals.length,
    });
    const topInsight = insightCandidates[0];

    // Next best action
    const nextBestAction = computeNextBestAction({
      hourOfDay,
      todayMeals,
      currentProteinG,
      targetProteinG: profile.proteinG,
      isDayComplete: streak.isDayComplete,
    });

    // Latest weight
    const latestWeight = await db
      .select()
      .from(weightEntries)
      .where(eq(weightEntries.userId, userId))
      .orderBy(desc(weightEntries.recordedAt))
      .limit(1);

    return reply.status(200).send({
      date: todayStr,
      userFirstName: "there",
      calorieTarget: profile.calorieTarget,
      proteinTargetG: profile.proteinG,
      carbsTargetG: profile.carbsG,
      fatTargetG: profile.fatG,
      currentKcal,
      currentProteinG,
      currentCarbsG,
      currentFatG,
      remainingKcal: Math.max(0, profile.calorieTarget - currentKcal),
      remainingProteinG: Math.max(0, profile.proteinG - currentProteinG),
      nextBestAction,
      insight: topInsight
        ? {
            id: crypto.randomUUID(),
            type: topInsight.type,
            text: topInsight.defaultText,
            why: topInsight.defaultWhy,
            actionableTip: topInsight.actionableTip,
            shownAt: now.toISOString(),
          }
        : null,
      timelineMeals: todayMeals.map((m) => ({
        id: m.id,
        userId: m.userId,
        mealType: m.mealType,
        source: m.source,
        loggedAt: m.loggedAt.toISOString(),
        rawInput: m.rawInput ?? undefined,
        items: itemsByMealId.get(m.id) ?? [],
        totalKcal: m.totalKcal,
        proteinG: m.proteinG,
        carbsG: m.carbsG,
        fatG: m.fatG,
        confidence: m.confidence,
        isSkipped: m.isSkipped,
        idempotencyKey: m.idempotencyKey,
        createdAt: m.createdAt.toISOString(),
      })),
      activeHabits: habits.slice(0, 3).map((h) => ({
        type: h.type,
        title: h.title,
        why: h.why,
        metric: h.metric,
        target: h.target,
        source: h.source,
        active: h.active,
      })),
      streak,
      flaggedBiomarkers,
      currentWeightKg: latestWeight.length > 0 ? latestWeight[0]!.weightKg : null,
      weightTrendKgPerWeek: null,
    });
  });
}

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
