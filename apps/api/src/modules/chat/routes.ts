import type { FastifyInstance } from "fastify";
import { sendChatMessageSchema } from "@hale/shared";
import { authMiddleware } from "../../infra/auth.js";
import { db } from "../../infra/db/connection.js";
import { chatThreads, chatMessages, profiles, meals } from "../../infra/db/schema.js";
import { eq, desc } from "drizzle-orm";
import { FakeAIProvider } from "../../ai/fake-provider.js";

const aiProvider = new FakeAIProvider();

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authMiddleware);

  /**
   * POST /v1/chat/messages
   * Grounded chat with assistant. Streams response chunks via SSE.
   */
  app.post("/chat/messages", async (request, reply) => {
    const body = sendChatMessageSchema.parse(request.body);
    const userId = request.userId;

    // Ensure thread exists
    let threadId = body.threadId;
    if (!threadId) {
      const newThreadId = crypto.randomUUID();
      await db.insert(chatThreads).values({
        id: newThreadId,
        userId,
        title: "Health Chat",
      });
      threadId = newThreadId;
    }

    // Save user message
    await db.insert(chatMessages).values({
      id: crypto.randomUUID(),
      threadId,
      role: "user",
      content: body.content,
      toolCalls: [],
    });

    // Gather grounded context
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    const recentMeals = await db
      .select()
      .from(meals)
      .where(eq(meals.userId, userId))
      .orderBy(desc(meals.loggedAt))
      .limit(5);

    const groundedContext = {
      profile: profile[0] ?? null,
      recentMeals,
    };

    // Setup SSE response headers
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");

    // Execute chat with streaming
    let assistantReply = "";
    await aiProvider.chatStream(
      [{ role: "user", content: body.content }],
      groundedContext,
      (chunk: string) => {
        assistantReply += chunk;
        reply.raw.write(`data: ${JSON.stringify({ type: "delta", content: chunk })}\n\n`);
      },
      async (toolName: string, args: Record<string, unknown>) => {
        reply.raw.write(
          `data: ${JSON.stringify({ type: "tool_call", tool: { name: toolName, args } })}\n\n`
        );
        return { success: true };
      }
    );

    // Persist assistant message
    await db.insert(chatMessages).values({
      id: crypto.randomUUID(),
      threadId,
      role: "assistant",
      content: assistantReply,
      toolCalls: [],
    });

    reply.raw.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    reply.raw.end();
  });
}

