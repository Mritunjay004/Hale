import { z } from "zod";

export const createSessionSchema = z.object({
  deviceSecretHash: z.string().min(16, "Device secret hash required"),
  timezone: z.string().default("UTC"),
});

export const sessionResponseSchema = z.object({
  token: z.string(),
  userId: z.string(),
  isNewUser: z.boolean(),
  timezone: z.string(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

