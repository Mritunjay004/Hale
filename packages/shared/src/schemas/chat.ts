import { z } from "zod";
import { parsedMealSchema } from "./meal.js";

export const chatRoleEnum = z.enum(["user", "assistant", "system"]);

export const toolCallSchema = z.object({
  id: z.string(),
  name: z.enum(["log_meal", "get_summary", "get_report_parameters"]),
  arguments: z.record(z.unknown()),
  result: z
    .object({
      success: z.boolean(),
      summary: z.string(),
      parsedMeal: parsedMealSchema.optional(),
      data: z.unknown().optional(),
    })
    .optional(),
});

export const chatMessageSchema = z.object({
  id: z.string(),
  role: chatRoleEnum,
  content: z.string(),
  toolCalls: z.array(toolCallSchema).optional(),
  createdAt: z.string(),
});

export const sendChatMessageSchema = z.object({
  content: z.string().min(1),
  threadId: z.string().optional(),
});

export const chatStreamChunkSchema = z.object({
  type: z.enum(["delta", "tool_call", "tool_result", "done", "error"]),
  content: z.string().optional(),
  toolCall: toolCallSchema.optional(),
  error: z.string().optional(),
});

export type ChatRole = z.infer<typeof chatRoleEnum>;
export type ToolCall = z.infer<typeof toolCallSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
export type ChatStreamChunk = z.infer<typeof chatStreamChunkSchema>;

