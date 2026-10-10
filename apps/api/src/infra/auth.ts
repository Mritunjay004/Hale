import type { FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "./db/connection.js";
import { users } from "./db/schema.js";
import { AuthError } from "./errors.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

/**
 * Auth middleware: extracts Bearer token, looks up user, attaches userId.
 * Token is the user's UUID directly (simple device-bound session).
 */
export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new AuthError("Empty token");
  }

  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, token))
    .limit(1);

  if (user.length === 0) {
    throw new AuthError("Invalid session token");
  }

  request.userId = user[0]!.id;
}
