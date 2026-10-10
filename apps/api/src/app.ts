import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { errorHandler } from "./infra/errors.js";
import { config } from "./infra/config.js";
import { sessionRoutes } from "./modules/sessions/routes.js";
import { profileRoutes } from "./modules/profile/routes.js";
import { mealRoutes } from "./modules/meals/routes.js";
import { todayRoutes } from "./modules/today/routes.js";
import { reportRoutes } from "./modules/reports/routes.js";
import { chatRoutes } from "./modules/chat/routes.js";
import { devRoutes } from "./modules/dev/routes.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "test" ? "silent" : "info",
    },
    disableRequestLogging: config.NODE_ENV === "test",
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // Plugins
  void app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  void app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB max for photos / lab PDFs
    },
  });

  // Health endpoint
  app.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "hale-api",
    };
  });

  // Route modules under /v1
  void app.register(
    async (v1) => {
      void v1.register(sessionRoutes);
      void v1.register(profileRoutes);
      void v1.register(mealRoutes);
      void v1.register(todayRoutes);
      void v1.register(reportRoutes);
      void v1.register(chatRoutes);
      if (config.DEMO_MODE_ENABLED) {
        void v1.register(devRoutes);
      }
    },
    { prefix: "/v1" }
  );

  return app;
}

