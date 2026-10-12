import type { FastifyInstance } from "fastify";
import { saveMealSchema, parseMealRequestSchema } from "@hale/shared";
import { authMiddleware } from "../../infra/auth.js";
import { db } from "../../infra/db/connection.js";
import { meals, mealItems } from "../../infra/db/schema.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { aiProvider } from "../../ai/factory.js";
import { NotFoundError, ConflictError } from "../../infra/errors.js";

export async function mealRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authMiddleware);

  /**
   * POST /v1/meals/parse
   * Parse food input (text, audio, or image) into structured meal items.
   * Does NOT save — returns parsed data for the confirmation sheet.
   */
  app.post("/meals/parse", async (request, reply) => {
    const body = parseMealRequestSchema.parse(request.body);
    const parsed = await aiProvider.parseMealText(
      body.text ?? "",
      {
        timeOfDay: body.clientTimestamp,
        suggestedMealType: body.mealType,
      }
    );
    return reply.status(200).send(parsed);
  });

  /**
   * POST /v1/meals/parse-audio
   * Accepts multipart audio file upload (m4a, mp4, wav, aac, etc.),
   * transcribes with Groq Whisper, and parses into structured meal items.
   */
  app.post("/meals/parse-audio", async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: "Audio file is required in multipart field 'file'",
      });
    }

    const audioBuffer = await data.toBuffer();
    const mimeType = data.mimetype || "audio/m4a";

    const mealTypeField = data.fields?.["mealType"] || data.fields?.["suggestedMealType"];
    const suggestedMealType =
      mealTypeField && typeof mealTypeField === "object" && "value" in mealTypeField
        ? String((mealTypeField as { value: unknown }).value)
        : typeof mealTypeField === "string"
          ? mealTypeField
          : undefined;

    // 1. Transcribe speech to text
    const transcribedText = await aiProvider.transcribeAudio(audioBuffer, mimeType);

    // 2. Parse transcribed text into nutritional meal breakdown
    const parsed = await aiProvider.parseMealText(
      transcribedText,
      {
        timeOfDay: new Date().toISOString(),
        suggestedMealType,
      }
    );

    return reply.status(200).send({
      transcription: transcribedText,
      meal: parsed,
    });
  });

  /**
   * POST /v1/meals/parse-image
   * Accepts multipart plate photo upload (jpeg, png, heic),
   * identifies food items with multimodal Gemini vision, and returns parsed meal breakdown.
   */
  app.post("/meals/parse-image", async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: "Image file is required in multipart field 'file'",
      });
    }

    const imageBuffer = await data.toBuffer();
    const mimeType = data.mimetype || "image/jpeg";

    const hintField = data.fields?.["hint"];
    const hint =
      hintField && typeof hintField === "object" && "value" in hintField
        ? String((hintField as { value: unknown }).value)
        : typeof hintField === "string"
          ? hintField
          : undefined;

    const mealTypeField = data.fields?.["mealType"] || data.fields?.["suggestedMealType"];
    const suggestedMealType =
      mealTypeField && typeof mealTypeField === "object" && "value" in mealTypeField
        ? String((mealTypeField as { value: unknown }).value)
        : typeof mealTypeField === "string"
          ? mealTypeField
          : undefined;

    const parsed = await aiProvider.parseMealImage(
      imageBuffer,
      mimeType,
      hint,
      suggestedMealType
    );

    return reply.status(200).send(parsed);
  });

  /**
   * POST /v1/meals
   * Save a confirmed meal (idempotent via idempotencyKey).
   */
  app.post("/meals", async (request, reply) => {
    const body = saveMealSchema.parse(request.body);
    const userId = request.userId;

    // Idempotency check
    const existing = await db
      .select({ id: meals.id })
      .from(meals)
      .where(eq(meals.idempotencyKey, body.idempotencyKey))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError("Meal with this idempotency key already exists");
    }

    const mealId = crypto.randomUUID();
    await db.insert(meals).values({
      id: mealId,
      userId,
      loggedAt: body.loggedAt ? new Date(body.loggedAt) : new Date(),
      mealType: body.mealType,
      source: body.source,
      rawInput: body.rawInput ?? null,
      totalKcal: body.totalKcal,
      proteinG: body.proteinG,
      carbsG: body.carbsG,
      fatG: body.fatG,
      confidence: body.confidence,
      isSkipped: body.isSkipped,
      idempotencyKey: body.idempotencyKey,
    });

    // Insert meal items
    for (const item of body.items) {
      await db.insert(mealItems).values({
        mealId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        kcal: item.kcal,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG,
        confidence: item.confidence,
      });
    }

    return reply.status(201).send({ id: mealId, saved: true });
  });

  /**
   * GET /v1/meals?date=YYYY-MM-DD
   * Retrieve meals for a specific date.
   */
  app.get("/meals", async (request, reply) => {
    const userId = request.userId;
    const { date } = request.query as { date?: string };
    const targetDate = date ?? new Date().toISOString().split("T")[0]!;

    const dayStart = new Date(`${targetDate}T00:00:00.000Z`);
    const dayEnd = new Date(`${targetDate}T23:59:59.999Z`);

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

    const result = await db
      .select()
      .from(meals)
      .where(
        and(
          eq(meals.userId, userId),
          gte(meals.loggedAt, dayStart),
          lte(meals.loggedAt, dayEnd)
        )
      );

    return reply.status(200).send(result);
  });

  /**
   * DELETE /v1/meals/:id
   */
  app.delete("/meals/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.userId;

    const existing = await db
      .select({ id: meals.id })
      .from(meals)
      .where(and(eq(meals.id, id), eq(meals.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundError("Meal");
    }

    await db.delete(mealItems).where(eq(mealItems.mealId, id));
    await db.delete(meals).where(eq(meals.id, id));

    return reply.status(200).send({ deleted: true });
  });
}
