import type { ParsedMeal, ExtractedReportResponse } from "@hale/shared";

/**
 * Speech to Text Provider Interface
 */
export interface SpeechToTextProvider {
  transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string>;
}

/**
 * Multimodal Vision & Image Parser Interface
 */
export interface VisionProvider {
  parseMealImage(imageBuffer: Buffer, mimeType: string, clientHint?: string, suggestedMealType?: string): Promise<ParsedMeal>;
  extractReportDocument(fileBuffer: Buffer, mimeType: string): Promise<ExtractedReportResponse>;
}

/**
 * Text LLM Provider Interface
 */
export interface LLMProvider {
  parseMealText(text: string, context?: { timeOfDay?: string | undefined; suggestedMealType?: string | undefined }): Promise<ParsedMeal>;
  phraseInsight(facts: Record<string, unknown>, candidateType: string): Promise<{ text: string; why: string; tip?: string }>;
  chatStream(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    groundedContext: Record<string, unknown>,
    onChunk: (delta: string) => void,
    onToolCall?: (toolName: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>
  ): Promise<string>;
}

