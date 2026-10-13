import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { chatRoutes } from "../src/modules/chat/routes.js";
import { chatMessages } from "../src/infra/db/schema.js";
import { chatMessageSchema } from "@hale/shared";

const { select, insert, saveValues, chatStream } = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  saveValues: vi.fn(),
  chatStream: vi.fn(),
}));

vi.mock("../src/infra/db/connection.js", () => ({ db: { select, insert } }));
vi.mock("../src/infra/auth.js", () => ({ authMiddleware: vi.fn() }));
vi.mock("../src/ai/factory.js", () => ({ aiProvider: { chatStream } }));

function queryResult(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
    then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(rows).then(resolve),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  select
    .mockReturnValueOnce(queryResult([{ id: "thread-1" }]))
    .mockReturnValueOnce(queryResult([])) // profile
    .mockReturnValueOnce(queryResult([])) // today's meals
    .mockReturnValueOnce(queryResult([])) // habits
    .mockReturnValueOnce(queryResult([])); // reports
  insert.mockReturnValue({ values: saveValues });
  saveValues.mockResolvedValue(undefined);
  chatStream.mockImplementation(async (_messages, _context, onChunk) => {
    await new Promise<void>((resolve) => setImmediate(resolve));
    onChunk("Try paneer with dal. ");
    onChunk("This can help meet your protein target.");
    return "Try paneer with dal. This can help meet your protein target.";
  });
});

async function sendMessage(requestState: Record<string, boolean>, responseDestroyed = false) {
  // Capture the registered handler so an empty return fails immediately,
  // without waiting indefinitely for an HTTP response that was never sent.
  const post = vi.fn();
  await chatRoutes({ addHook: vi.fn(), get: vi.fn(), post } as unknown as FastifyInstance);
  const handler = post.mock.calls[0]![1];
  const request = {
    body: { content: "What dinner should I eat to hit 30g protein?", threadId: "thread-1" },
    userId: "user-1",
    headers: { accept: "application/json" },
    raw: requestState,
  } as unknown as FastifyRequest;
  const send = vi.fn().mockImplementation((body) => body);
  const reply = {
    raw: { destroyed: responseDestroyed },
    status: vi.fn().mockReturnThis(),
    send,
  } as unknown as FastifyReply;

  const result = await handler(request, reply);
  return { result, reply, send };
}

describe("Coach JSON response delivery", () => {
  it.each([
    { complete: true, closed: true, destroyed: true },
    { complete: true, closed: true, destroyed: false },
    { complete: true, closed: false, destroyed: false },
  ])("saves and sends the assistant reply after a completed request: %j", async (requestState) => {
    const { result, reply, send } = await sendMessage(requestState);

    expect(reply.status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledTimes(1);
    expect(result.threadId).toBe("thread-1");
    expect(chatMessageSchema.parse(result.message).content).toBe(
      "Try paneer with dal. This can help meet your protein target."
    );
    expect(insert).toHaveBeenLastCalledWith(chatMessages);
    expect(saveValues).toHaveBeenCalledTimes(2);
    expect(saveValues).toHaveBeenLastCalledWith(expect.objectContaining({
      threadId: "thread-1",
      role: "assistant",
      content: result.message.content,
    }));
  });

  it("does not send a reply to a client that actually disconnected", async () => {
    const { send } = await sendMessage({ complete: true, closed: true, destroyed: true }, true);

    expect(send).not.toHaveBeenCalled();
    expect(saveValues).toHaveBeenCalledTimes(1); // only the user message
  });
});
