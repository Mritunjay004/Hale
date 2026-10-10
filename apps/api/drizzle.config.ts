import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./src/infra/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env["DATABASE_URL"] ??
      `postgresql://${process.env["USER"] ?? "apple"}@localhost:5432/hale_dev`,
  },
  verbose: true,
  strict: true,
});
