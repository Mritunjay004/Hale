import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../apps/api/src/app.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance | null = null;

/**
 * Serverless entrypoint for Vercel.
 * Bridges incoming HTTP requests to the initialized Fastify instance with app.ready() caching.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!app) {
    app = buildApp();
    await app.ready();
  }
  app.server.emit("request", req, res);
}
