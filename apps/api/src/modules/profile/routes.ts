import type { FastifyInstance } from "fastify";
import { planRequestSchema, type PlanResponse } from "@hale/shared";
import { calculatePlan } from "../../domain/nutrition.js";
import { authMiddleware } from "../../infra/auth.js";
import { db } from "../../infra/db/connection.js";
import { profiles, focusHabits } from "../../infra/db/schema.js";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../../infra/errors.js";

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authMiddleware);

  /**
   * POST /v1/profile/plan
   * Compute calorie/macro targets and focus habits from onboarding input.
   * Returns the plan without saving (client confirms first).
   */
  app.post("/profile/plan", async (request, reply) => {
    const input = planRequestSchema.parse(request.body);
    const plan: PlanResponse = calculatePlan(input);
    return reply.status(200).send(plan);
  });

  /**
   * PUT /v1/profile
   * Save confirmed profile with computed targets and habits.
   */
  app.put("/profile", async (request, reply) => {
    const input = planRequestSchema.parse(request.body);
    const plan = calculatePlan(input);
    const userId = request.userId;

    // Upsert profile
    const existing = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    const profileData = {
      userId,
      age: input.age,
      sex: input.sex,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      activityLevel: input.activityLevel,
      dietPreference: input.dietPreference,
      goalType: input.goalType,
      targetWeightKg: input.targetWeightKg ?? null,
      targetDate: plan.pushback?.proposedTargetDate ?? null,
      calorieTarget: plan.calorieTarget,
      proteinG: plan.proteinG,
      carbsG: plan.carbsG,
      fatG: plan.fatG,
      notesTags: input.notesTags,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db.update(profiles).set(profileData).where(eq(profiles.userId, userId));
    } else {
      await db.insert(profiles).values(profileData);
    }

    // Replace focus habits
    await db.delete(focusHabits).where(eq(focusHabits.userId, userId));
    for (const habit of plan.focusHabits) {
      await db.insert(focusHabits).values({
        userId,
        type: habit.type,
        title: habit.title,
        why: habit.why,
        metric: habit.metric,
        target: habit.target ?? null,
        source: habit.source,
        active: habit.active,
      });
    }

    return reply.status(200).send({ ...plan, saved: true });
  });

  /**
   * GET /v1/profile
   * Retrieve current user profile.
   */
  app.get("/profile", async (request, reply) => {
    const userId = request.userId;
    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundError("Profile");
    }

    const habits = await db
      .select()
      .from(focusHabits)
      .where(eq(focusHabits.userId, userId));

    return reply.status(200).send({
      ...result[0],
      focusHabits: habits,
    });
  });
}
