import type { FastifyInstance } from "fastify";
import { sendChatMessageSchema, CANONICAL_BIOMARKERS } from "@hale/shared";
import { authMiddleware } from "../../infra/auth.js";
import { db } from "../../infra/db/connection.js";
import {
  chatThreads,
  chatMessages,
  profiles,
  meals,
  mealItems,
  focusHabits,
  reports,
  reportParameters,
} from "../../infra/db/schema.js";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { aiProvider } from "../../ai/factory.js";

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authMiddleware);

  /**
   * GET /v1/chat/messages
   * Retrieve active chat thread and previous messages.
   */
  app.get("/chat/messages", async (request, reply) => {
    const userId = request.userId;

    // Find or create active thread
    let thread = await db
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.userId, userId))
      .orderBy(desc(chatThreads.createdAt))
      .limit(1);

    let threadId = thread[0]?.id;
    if (!threadId) {
      threadId = crypto.randomUUID();
      await db.insert(chatThreads).values({
        id: threadId,
        userId,
        title: "Health Coach",
      });

      // Insert welcoming message
      const initialMsgId = crypto.randomUUID();
      await db.insert(chatMessages).values({
        id: initialMsgId,
        threadId,
        role: "assistant",
        content:
          "Hi there! 👋 I'm your Hale Clinical Nutrition Coach. I have your health plan, today's meal logs, and lab biomarkers in mind.\n\nYou can ask me for meal ideas to hit your protein, question any lab marker (like Vitamin D or HbA1c), or simply type what you ate (e.g. \"Log 2 rotis and yellow dal\") to log it instantly!",
        toolCalls: [],
      });
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.threadId, threadId))
      .orderBy(asc(chatMessages.createdAt));

    return reply.status(200).send({
      threadId,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  });

  /**
   * POST /v1/chat/messages
   * Grounded chat with assistant.
   * Supports both streaming SSE and JSON response formats.
   */
  app.post("/chat/messages", async (request, reply) => {
    const body = sendChatMessageSchema.parse(request.body);
    const userId = request.userId;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]!;

    // 1. Ensure thread exists
    let threadId = body.threadId;
    if (!threadId) {
      const existingThread = await db
        .select()
        .from(chatThreads)
        .where(eq(chatThreads.userId, userId))
        .orderBy(desc(chatThreads.createdAt))
        .limit(1);

      if (existingThread.length > 0) {
        threadId = existingThread[0]!.id;
      } else {
        threadId = crypto.randomUUID();
        await db.insert(chatThreads).values({
          id: threadId,
          userId,
          title: "Health Coach",
        });
      }
    }

    // 2. Persist user message
    const userMessageId = crypto.randomUUID();
    await db.insert(chatMessages).values({
      id: userMessageId,
      threadId,
      role: "user",
      content: body.content,
      toolCalls: [],
    });

    // 3. Gather rich grounded context
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    const userProfile = profile[0];

    const dayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${todayStr}T23:59:59.999Z`);
    const todayMeals = await db
      .select()
      .from(meals)
      .where(
        and(eq(meals.userId, userId), gte(meals.loggedAt, dayStart), lte(meals.loggedAt, dayEnd))
      );

    let currentKcal = 0;
    let currentProteinG = 0;
    for (const m of todayMeals) {
      currentKcal += m.totalKcal;
      currentProteinG += m.proteinG;
    }

    const calorieTarget = userProfile?.calorieTarget ?? 2000;
    const proteinTarget = userProfile?.proteinG ?? 100;

    const habits = await db
      .select()
      .from(focusHabits)
      .where(and(eq(focusHabits.userId, userId), eq(focusHabits.active, true)));

    // Latest lab report flagged markers
    const flaggedBiomarkers: Array<{ name: string; value: number; unit: string; status: string }> = [];
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
        if (p.status === "low" || p.status === "high") {
          flaggedBiomarkers.push({
            name: p.name,
            value: p.value,
            unit: p.unit,
            status: p.status,
          });
        }
      }
    }

    const groundedContext = {
      profile: userProfile
        ? {
            calorieTarget,
            proteinTargetG: proteinTarget,
            carbsTargetG: userProfile.carbsG,
            fatTargetG: userProfile.fatG,
            goalType: userProfile.goalType,
          }
        : null,
      currentKcal,
      targetKcal: calorieTarget,
      remainingKcal: Math.max(0, calorieTarget - currentKcal),
      currentProteinG,
      targetProteinG: proteinTarget,
      remainingProteinG: Math.max(0, proteinTarget - currentProteinG),
      mealsCountToday: todayMeals.length,
      activeHabits: habits.map((h) => ({ title: h.title, why: h.why })),
      flaggedBiomarkers,
    };

    const executedToolCalls: Array<{
      id: string;
      name: "log_meal" | "get_summary" | "get_report_parameters" | "explain_biomarker" | "suggest_meal";
      arguments: Record<string, unknown>;
      result: {
        success: boolean;
        summary: string;
        parsedMeal?: any;
        data?: any;
      };
    }> = [];

    // Tool execution handler
    const handleToolCall = async (toolName: string, args: Record<string, unknown>) => {
      const toolId = crypto.randomUUID();

      if (toolName === "log_meal") {
        const text = String(args.text ?? body.content);
        try {
          const parsedMeal = await aiProvider.parseMealText(text);
          const mealId = crypto.randomUUID();

          await db.insert(meals).values({
            id: mealId,
            userId,
            mealType: parsedMeal.mealType,
            source: "chat",
            rawInput: text,
            totalKcal: parsedMeal.totalKcal,
            proteinG: parsedMeal.proteinG,
            carbsG: parsedMeal.carbsG,
            fatG: parsedMeal.fatG,
            confidence: parsedMeal.confidence,
            isSkipped: parsedMeal.isSkipped,
            idempotencyKey: crypto.randomUUID(),
          });

          for (const item of parsedMeal.items) {
            await db.insert(mealItems).values({
              id: crypto.randomUUID(),
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

          const res = {
            success: true,
            summary: `+${parsedMeal.totalKcal} kcal, ${parsedMeal.proteinG}g protein logged`,
            parsedMeal,
          };
          executedToolCalls.push({
            id: toolId,
            name: "log_meal",
            arguments: args,
            result: res,
          });
          return res;
        } catch (err) {
          const res = { success: false, summary: "Could not parse food item" };
          executedToolCalls.push({
            id: toolId,
            name: "log_meal",
            arguments: args,
            result: res,
          });
          return res;
        }
      }

      if (toolName === "explain_biomarker") {
        const key = String(args.biomarkerKey ?? "vitamin_d");
        const def = CANONICAL_BIOMARKERS[key];
        const res = {
          success: true,
          summary: `Explained ${def?.name ?? key}`,
          data: def ?? null,
        };
        executedToolCalls.push({
          id: toolId,
          name: "explain_biomarker",
          arguments: args,
          result: res,
        });
        return res;
      }

      if (toolName === "suggest_meal") {
        const res = {
          success: true,
          summary: "Suggested balanced high-protein dinner",
          data: { remainingKcal: groundedContext.remainingKcal, remainingProteinG: groundedContext.remainingProteinG },
        };
        executedToolCalls.push({
          id: toolId,
          name: "suggest_meal",
          arguments: args,
          result: res,
        });
        return res;
      }

      return { success: true, summary: "Completed" };
    };

    const isSse = request.headers.accept?.includes("text/event-stream");

    if (isSse) {
      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache");
      reply.raw.setHeader("Connection", "keep-alive");

      let assistantReply = "";
      await aiProvider.chatStream(
        [{ role: "user", content: body.content }],
        groundedContext,
        (chunk: string) => {
          assistantReply += chunk;
          reply.raw.write(`data: ${JSON.stringify({ type: "delta", content: chunk })}\n\n`);
        },
        handleToolCall
      );

      const assistantMsgId = crypto.randomUUID();
      await db.insert(chatMessages).values({
        id: assistantMsgId,
        threadId,
        role: "assistant",
        content: assistantReply,
        toolCalls: executedToolCalls,
      });

      for (const tc of executedToolCalls) {
        reply.raw.write(`data: ${JSON.stringify({ type: "tool_call", toolCall: tc })}\n\n`);
      }

      reply.raw.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      reply.raw.end();
      return;
    }

    // Standard JSON response
    let assistantReply = "";
    await aiProvider.chatStream(
      [{ role: "user", content: body.content }],
      groundedContext,
      (chunk: string) => {
        assistantReply += chunk;
      },
      handleToolCall
    );

    const assistantMsgId = crypto.randomUUID();
    await db.insert(chatMessages).values({
      id: assistantMsgId,
      threadId,
      role: "assistant",
      content: assistantReply,
      toolCalls: executedToolCalls,
    });

    return reply.status(200).send({
      threadId,
      message: {
        id: assistantMsgId,
        role: "assistant",
        content: assistantReply,
        toolCalls: executedToolCalls,
        createdAt: new Date().toISOString(),
      },
    });
  });
}
