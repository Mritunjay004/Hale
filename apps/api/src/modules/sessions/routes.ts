import type { FastifyInstance } from "fastify";
import { createSessionSchema } from "@hale/shared";
import { db } from "../../infra/db/connection.js";
import { users } from "../../infra/db/schema.js";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /v1/sessions
   * Create an anonymous device-bound session.
   * Client sends a device secret hash, server creates or finds the user.
   */
  app.post("/sessions", async (request, reply) => {
    const body = createSessionSchema.parse(request.body);

    // Check if user exists with this device secret
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.deviceSecretHash, body.deviceSecretHash))
      .limit(1);

    if (existing.length > 0) {
      const user = existing[0]!;
      return reply.status(200).send({
        token: user.id,
        userId: user.id,
        isNewUser: false,
        timezone: user.timezone,
      });
    }

    // Create new user
    const id = crypto.randomUUID();
    await db.insert(users).values({
      id,
      deviceSecretHash: body.deviceSecretHash,
      timezone: body.timezone,
    });

    return reply.status(201).send({
      token: id,
      userId: id,
      isNewUser: true,
      timezone: body.timezone,
    });
  });
}
