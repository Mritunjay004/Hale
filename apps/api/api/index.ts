import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../src/app.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance | null = null;

/**
 * Serverless entrypoint for Vercel when Root Directory is set to apps/api.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!app) {
    app = buildApp();
    await app.ready();
  }
  app.server.emit("request", req, res);
}
