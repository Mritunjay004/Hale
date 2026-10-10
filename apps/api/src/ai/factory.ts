import { config } from "../infra/config.js";
import { FakeAIProvider } from "./fake-provider.js";
import { GeminiAIProvider } from "./gemini-provider.js";
import type { LLMProvider, VisionProvider } from "./interfaces.js";
import type { ParsedMeal, ExtractedReportResponse } from "@hale/shared";

/**
 * Resilient AI Provider with automatic fallback decorator.
 * If live Gemini fails or encounters network/rate limits, seamlessly falls back to the local dynamic parser.
 */
class ResilientAIProvider implements LLMProvider, VisionProvider {
  private primary: GeminiAIProvider | null = null;
  private fallback: FakeAIProvider;

  constructor() {
    this.fallback = new FakeAIProvider();
    if (config.AI_PROVIDER === "gemini" && config.GEMINI_API_KEY) {
      console.log(`🤖 Initialized Primary Google Gemini AI Provider (${config.GEMINI_MODEL}) (with Local Fallback)`);
      this.primary = new GeminiAIProvider(config.GEMINI_API_KEY, config.GEMINI_MODEL);
    } else {
      console.log("🧪 Using Dynamic Local AI Provider");
    }
  }

  async parseMealText(text: string, context?: { timeOfDay?: string }): Promise<ParsedMeal> {
    if (this.primary) {
      try {
        return await this.primary.parseMealText(text, context);
      } catch (err) {
        console.warn("⚠️ Live Gemini call failed. Gracefully falling back to local engine:", err);
      }
    }
    return this.fallback.parseMealText(text, context);
  }

  async parseMealImage(
    imageBuffer: Buffer,
    mimeType: string,
    clientHint?: string
  ): Promise<ParsedMeal> {
    if (this.primary) {
      try {
        return await this.primary.parseMealImage(imageBuffer, mimeType, clientHint);
      } catch (err) {
        console.warn("⚠️ Live Vision call failed. Gracefully falling back to local engine:", err);
      }
    }
    return this.fallback.parseMealImage(imageBuffer, mimeType, clientHint);
  }

  async extractReportDocument(
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<ExtractedReportResponse> {
    return this.fallback.extractReportDocument(fileBuffer, mimeType);
  }

  async phraseInsight(
    facts: Record<string, unknown>,
    candidateType: string
  ): Promise<{ text: string; why: string; tip?: string }> {
    if (this.primary) {
      try {
        return await this.primary.phraseInsight(facts, candidateType);
      } catch {
        // ignore and fallback
      }
    }
    return this.fallback.phraseInsight(facts, candidateType);
  }

  async chatStream(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    groundedContext: Record<string, unknown>,
    onChunk: (delta: string) => void,
    onToolCall?: (toolName: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>
  ): Promise<string> {
    return this.fallback.chatStream(messages, groundedContext, onChunk, onToolCall);
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    return this.fallback.transcribeAudio(audioBuffer, mimeType);
  }
}

export const aiProvider = new ResilientAIProvider();
