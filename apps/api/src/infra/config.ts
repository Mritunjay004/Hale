import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://postgres:postgres@localhost:5432/hale_dev"),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:8081"),
  AI_PROVIDER: z.enum(["fake", "gemini", "groq"]).default("fake"),
  GEMINI_API_KEY: z.string().default(""),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
  GROQ_API_KEY: z.string().default(""),
  DEMO_MODE_ENABLED: z.coerce.boolean().default(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  if (process.env.NODE_ENV !== "test") {
    process.exit(1);
  }
}

export type Config = z.infer<typeof envSchema>;
export const config: Config = parsed.success
  ? parsed.data
  : envSchema.parse({});
