export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
export const GEMINI_FALLBACK_MODELS = [
  DEFAULT_GEMINI_MODEL,
  "gemini-3.5-flash-lite",
] as const;

/** Keep stale deployment settings from selecting retired 1.5/2.0 models. */
export function resolveGeminiModel(modelName?: string): string {
  const model = modelName?.trim().replace(/^models\//, "");
  if (!model || /^gemini-(1\.5|2\.0)-/.test(model)) {
    return DEFAULT_GEMINI_MODEL;
  }
  return model;
}
