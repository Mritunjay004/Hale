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
    const dayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${todayStr}T23:59:59.999Z`);
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

    // Fetch habits
    const habits = await db
      .select()
      .from(focusHabits)
      .where(and(eq(focusHabits.userId, userId), eq(focusHabits.active, true)));

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

    // Insight engine
    const insightCandidates = evaluateInsightRules({
      calorieTarget: profile.calorieTarget,
      proteinTargetG: profile.proteinG,
      consumedKcalToday: currentKcal,
      consumedProteinTodayG: currentProteinG,
      hourOfDay,
      streakDays: streak.currentStreakDays,
      flaggedBiomarkersCount: 0,
      recentLoggedMealCount: todayMeals.length,
    });
    const topInsight = insightCandidates[0];

    // Next best action
    const nextBestAction = computeNextBestAction(
      hourOfDay,
      todayMeals.length,
      currentProteinG,
      profile.proteinG,
      streak.isDayComplete
    );

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
      activeHabits: habits.map((h) => ({
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

function computeNextBestAction(
  hourOfDay: number,
  mealCount: number,
  currentProteinG: number,
  targetProteinG: number,
  isDayComplete: boolean
): NextBestAction {
  if (isDayComplete) {
    return {
      id: "day_complete",
      priority: "P3",
      title: "Day complete!",
      subtitle: "Great job logging your meals today. Rest well tonight.",
      ctaText: "View Summary",
      actionType: "complete",
    };
  }

  if (mealCount === 0 && hourOfDay >= 9) {
    return {
      id: "log_first_meal",
      priority: "P1",
      title: "Start your day",
      subtitle: "Log your first meal to kickstart today's tracking.",
      ctaText: "Log Meal",
      actionType: "log_meal",
      suggestedMealType: hourOfDay < 11 ? "breakfast" : "lunch",
    };
  }

  if (hourOfDay >= 12 && hourOfDay < 15 && mealCount < 2) {
    return {
      id: "log_lunch",
      priority: "P1",
      title: "Lunch not logged yet",
      subtitle: "You usually eat around now. Speak or snap your lunch in 10s.",
      ctaText: "Log Lunch",
      actionType: "log_meal",
      suggestedMealType: "lunch",
    };
  }

  const proteinGap = targetProteinG - currentProteinG;
  if (hourOfDay >= 16 && proteinGap > 25) {
    return {
      id: "protein_gap",
      priority: "P2",
      title: `${proteinGap}g protein to go`,
      subtitle: "Add Greek yogurt, paneer, or eggs with dinner to close the gap.",
      ctaText: "Log Dinner",
      actionType: "log_meal",
      suggestedMealType: "dinner",
    };
  }

  return {
    id: "log_next_meal",
    priority: "P2",
    title: "Log your next meal",
    subtitle: "Keep tracking to maintain your streak.",
    ctaText: "Log Meal",
    actionType: "log_meal",
  };
}
