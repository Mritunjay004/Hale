import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../../infra/auth.js";
import { db } from "../../infra/db/connection.js";
import {
  profiles,
  focusHabits,
  meals,
  mealItems,
  weightEntries,
  reports,
  reportParameters,
  achievements,
} from "../../infra/db/schema.js";
import { eq } from "drizzle-orm";

export async function devRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authMiddleware);

  /**
   * POST /v1/dev/seed-demo
   * Seeds demo data for reviewers: profile, 14 days of meals, weight trend, 2 reports.
   */
  app.post("/dev/seed-demo", async (request, reply) => {
    const userId = request.userId;

    // Clean up existing data for this user
    await db.delete(profiles).where(eq(profiles.userId, userId));
    await db.delete(focusHabits).where(eq(focusHabits.userId, userId));
    await db.delete(meals).where(eq(meals.userId, userId));
    await db.delete(weightEntries).where(eq(weightEntries.userId, userId));
    await db.delete(reports).where(eq(reports.userId, userId));
    await db.delete(achievements).where(eq(achievements.userId, userId));

    // 1. Seed Profile
    await db.insert(profiles).values({
      userId,
      age: 31,
      sex: "male",
      heightCm: 176,
      weightKg: 78.4,
      activityLevel: "sedentary",
      dietPreference: "none",
      goalType: "fat_loss",
      targetWeightKg: 72,
      targetDate: "2026-12-15",
      calorieTarget: 1850,
      proteinG: 95,
      carbsG: 208,
      fatG: 68,
      notesTags: ["mild_lactose_sensitive"],
      notificationPrefs: {
        smartMealReminders: true,
        eveningWrapUp: true,
      },
    });

    // 2. Seed 3 Focus Habits
    await db.insert(focusHabits).values([
      {
        userId,
        type: "protein_target",
        title: "Hit ~95g protein daily",
        why: "Protects lean muscle tissue in a deficit so fat is lost, not muscle.",
        metric: "Logged meals",
        target: 95,
        source: "onboarding",
        active: true,
      },
      {
        userId,
        type: "daily_logging",
        title: "Log meals consistently",
        why: "Logging meals consistently doubles fat-loss success.",
        metric: "Daily streak",
        source: "onboarding",
        active: true,
      },
      {
        userId,
        type: "biomarker_ldl_cholesterol",
        title: "Swap 2 fried snacks a week for roasted chana or nuts",
        why: "Your lipid report showed borderline LDL. Soluble fiber supports clearance.",
        metric: "Whole food snacks",
        source: "report",
        active: true,
      },
    ]);

    // 3. Seed 14 Days of Meals
    const now = new Date();
    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const dayDate = new Date(now);
      dayDate.setDate(dayDate.getDate() - dayOffset);

      // Breakfast
      const bDate = new Date(dayDate);
      bDate.setHours(8, 30, 0, 0);
      const bMealId = crypto.randomUUID();
      await db.insert(meals).values({
        id: bMealId,
        userId,
        loggedAt: bDate,
        mealType: "breakfast",
        source: "voice",
        rawInput: "Oats with milk, chia seeds and almonds",
        totalKcal: 390,
        proteinG: 18,
        carbsG: 52,
        fatG: 12,
        confidence: "high",
        idempotencyKey: crypto.randomUUID(),
      });
      await db.insert(mealItems).values({
        mealId: bMealId,
        name: "Oatmeal with Almonds",
        quantity: 1,
        unit: "bowl",
        kcal: 390,
        proteinG: 18,
        carbsG: 52,
        fatG: 12,
      });

      // Lunch
      const lDate = new Date(dayDate);
      lDate.setHours(13, 15, 0, 0);
      const lMealId = crypto.randomUUID();
      await db.insert(meals).values({
        id: lMealId,
        userId,
        loggedAt: lDate,
        mealType: "lunch",
        source: "camera",
        rawInput: "2 rotis, yellow dal, curd, salad",
        totalKcal: 520,
        proteinG: 28,
        carbsG: 68,
        fatG: 14,
        confidence: "high",
        idempotencyKey: crypto.randomUUID(),
      });
      await db.insert(mealItems).values([
        {
          mealId: lMealId,
          name: "Roti / Chapati",
          quantity: 2,
          unit: "pieces",
          kcal: 240,
          proteinG: 6,
          carbsG: 44,
          fatG: 4,
        },
        {
          mealId: lMealId,
          name: "Yellow Toor Dal",
          quantity: 1,
          unit: "katori",
          kcal: 180,
          proteinG: 11,
          carbsG: 20,
          fatG: 4,
        },
        {
          mealId: lMealId,
          name: "Curd / Dahi",
          quantity: 1,
          unit: "bowl",
          kcal: 100,
          proteinG: 11,
          carbsG: 4,
          fatG: 6,
        },
      ]);
    }

    // 4. Seed Weight Entries
    const w1Date = new Date(now);
    w1Date.setDate(w1Date.getDate() - 14);
    const w2Date = new Date(now);
    w2Date.setDate(w2Date.getDate() - 7);
    const w3Date = new Date(now);

    await db.insert(weightEntries).values([
      { userId, weightKg: 79.2, recordedAt: w1Date },
      { userId, weightKg: 78.8, recordedAt: w2Date },
      { userId, weightKg: 78.4, recordedAt: w3Date },
    ]);

    // 5. Seed 2 Lab Reports (for trend visualization)
    const report1Id = crypto.randomUUID();
    await db.insert(reports).values({
      id: report1Id,
      userId,
      reportDate: "2026-04-10",
      label: "Annual Executive Checkup",
      status: "ready",
    });
    await db.insert(reportParameters).values([
      {
        id: crypto.randomUUID(),
        reportId: report1Id,
        canonicalKey: "ldl_cholesterol",
        name: "LDL Cholesterol",
        value: 142,
        unit: "mg/dL",
        refLow: 50,
        refHigh: 99,
        status: "high",
      },
      {
        id: crypto.randomUUID(),
        reportId: report1Id,
        canonicalKey: "fasting_glucose",
        name: "Fasting Glucose",
        value: 94,
        unit: "mg/dL",
        refLow: 70,
        refHigh: 99,
        status: "normal",
      },
      {
        id: crypto.randomUUID(),
        reportId: report1Id,
        canonicalKey: "vitamin_d",
        name: "Vitamin D (25-OH)",
        value: 16,
        unit: "ng/mL",
        refLow: 30,
        refHigh: 100,
        status: "low",
      },
      {
        id: crypto.randomUUID(),
        reportId: report1Id,
        canonicalKey: "hba1c",
        name: "HbA1c",
        value: 5.6,
        unit: "%",
        refLow: 4.0,
        refHigh: 5.6,
        status: "normal",
      },
    ]);

    const report2Id = crypto.randomUUID();
    await db.insert(reports).values({
      id: report2Id,
      userId,
      reportDate: "2026-09-12",
      label: "Lipid & Sugar Follow-up",
      status: "ready",
    });
    await db.insert(reportParameters).values([
      {
        id: crypto.randomUUID(),
        reportId: report2Id,
        canonicalKey: "ldl_cholesterol",
        name: "LDL Cholesterol",
        value: 132,
        unit: "mg/dL",
        refLow: 50,
        refHigh: 99,
        status: "high",
      },
      {
        id: crypto.randomUUID(),
        reportId: report2Id,
        canonicalKey: "fasting_glucose",
        name: "Fasting Glucose",
        value: 91,
        unit: "mg/dL",
        refLow: 70,
        refHigh: 99,
        status: "normal",
      },
      {
        id: crypto.randomUUID(),
        reportId: report2Id,
        canonicalKey: "vitamin_d",
        name: "Vitamin D (25-OH)",
        value: 24,
        unit: "ng/mL",
        refLow: 30,
        refHigh: 100,
        status: "low",
      },
      {
        id: crypto.randomUUID(),
        reportId: report2Id,
        canonicalKey: "hba1c",
        name: "HbA1c",
        value: 5.3,
        unit: "%",
        refLow: 4.0,
        refHigh: 5.6,
        status: "normal",
      },
    ]);

    // 6. Seed Achievements
    await db.insert(achievements).values([
      { userId, key: "first_log" },
      { userId, key: "streak_3" },
      { userId, key: "streak_7" },
    ]);

    return reply.status(200).send({
      success: true,
      message: "Sample demo data seeded successfully with 14 days of logs, weight trends, and 2 reports.",
    });
  });

  /**
   * POST /v1/dev/reset-account
   * Wipes all user data (profile, habits, meals, reports, weight) for a clean slate.
   */
  app.post("/dev/reset-account", async (request, reply) => {
    const userId = request.userId;

    await db.delete(profiles).where(eq(profiles.userId, userId));
    await db.delete(focusHabits).where(eq(focusHabits.userId, userId));
    await db.delete(meals).where(eq(meals.userId, userId));
    await db.delete(weightEntries).where(eq(weightEntries.userId, userId));
    await db.delete(reports).where(eq(reports.userId, userId));
    await db.delete(achievements).where(eq(achievements.userId, userId));

    return reply.status(200).send({
      success: true,
      message: "Account reset successfully. Blank slate ready.",
    });
  });
}

