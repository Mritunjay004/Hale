import { z } from "zod";
import dotenv from "dotenv";
import { DEFAULT_GEMINI_MODEL, resolveGeminiModel } from "../ai/gemini-models.js";

dotenv.config();

const rawEnv = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL?.trim() || undefined,
  AI_PROVIDER:
    process.env.AI_PROVIDER?.trim().toLowerCase() ||
    (process.env.GEMINI_API_KEY?.trim() ? "gemini" : "fake"),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim() || "",
  GEMINI_MODEL: resolveGeminiModel(process.env.GEMINI_MODEL),
  GROQ_API_KEY: process.env.GROQ_API_KEY?.trim() || "",
};

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/hale_dev"),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("*"),
  AI_PROVIDER: z.enum(["fake", "gemini", "groq"]).default("fake"),
  GEMINI_API_KEY: z.string().default(""),
  GEMINI_MODEL: z.string().default(DEFAULT_GEMINI_MODEL),
  GROQ_API_KEY: z.string().default(""),
  DEMO_MODE_ENABLED: z.coerce.boolean().default(true),
});

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.warn("⚠️ Environment validation notice, using safe defaults:", parsed.error.flatten().fieldErrors);
}

export type Config = z.infer<typeof envSchema>;
export const config: Config = parsed.success
  ? parsed.data
  : envSchema.parse({});

