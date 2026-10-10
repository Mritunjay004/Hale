import { buildApp } from "./app.js";
import { config } from "./infra/config.js";
import { closeDb } from "./infra/db/connection.js";

const app = buildApp();

async function start() {
  try {
    const address = await app.listen({
      port: config.PORT,
      host: "0.0.0.0",
    });
    console.log(`🚀 Hale API server listening on ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
for (const signal of signals) {
  process.on(signal, async () => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    await app.close();
    await closeDb();
    process.exit(0);
  });
}

void start();

