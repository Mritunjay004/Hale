import { config } from "../infra/config.js";
import { FakeAIProvider } from "./fake-provider.js";
import { GeminiAIProvider } from "./gemini-provider.js";
import { GroqAudioProvider } from "./groq-audio-provider.js";
import type { LLMProvider, VisionProvider, SpeechToTextProvider } from "./interfaces.js";
import type { ParsedMeal, ExtractedReportResponse } from "@hale/shared";

/**
 * Resilient AI Provider with automatic fallback decorator.
 * If live Gemini fails or encounters network/rate limits, seamlessly falls back to the local dynamic parser.
 */
class ResilientAIProvider implements LLMProvider, VisionProvider, SpeechToTextProvider {
  private primary: GeminiAIProvider | null = null;
  private audioProvider: GroqAudioProvider | null = null;
  private fallback: FakeAIProvider;

  constructor() {
    this.fallback = new FakeAIProvider();
    if (config.AI_PROVIDER === "gemini" && config.GEMINI_API_KEY) {
      console.log(`🤖 Initialized Primary Google Gemini AI Provider (${config.GEMINI_MODEL}) (with Local Fallback)`);
      this.primary = new GeminiAIProvider(config.GEMINI_API_KEY, config.GEMINI_MODEL);
    } else {
      console.log("🧪 Using Dynamic Local AI Provider");
    }

    if (config.GROQ_API_KEY) {
      console.log("🎙️ Initialized Groq Whisper Large v3 Audio Provider");
      this.audioProvider = new GroqAudioProvider(config.GROQ_API_KEY);
    }
  }

  async parseMealText(
    text: string,
    context?: { timeOfDay?: string | undefined; suggestedMealType?: string | undefined }
  ): Promise<ParsedMeal> {
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
    clientHint?: string,
    suggestedMealType?: string
  ): Promise<ParsedMeal> {
    if (this.primary) {
      try {
        return await this.primary.parseMealImage(imageBuffer, mimeType, clientHint, suggestedMealType);
      } catch (err) {
        console.warn("⚠️ Live Vision call failed:", err);
        // Never invent fake food items for photos. Return an honest unable-to-identify response.
        return {
          mealType: "snack",
          items: [],
          totalKcal: 0,
          proteinG: 0,
          carbsG: 0,
          fatG: 0,
          confidence: "low",
          isFood: false,
          isSkipped: false,
          clarifyingQuestion:
            "We couldn't clearly identify the food in this photo. Please describe what you ate or snap another photo with better lighting.",
        };
      }
    }
    return this.fallback.parseMealImage(imageBuffer, mimeType, clientHint);
  }

  async extractReportDocument(
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<ExtractedReportResponse> {
    if (this.primary) {
      try {
        return await this.primary.extractReportDocument(fileBuffer, mimeType);
      } catch (err) {
        console.warn("⚠️ Live Gemini report extraction failed. Gracefully falling back to local engine:", err);
      }
    }
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
    if (this.primary) {
      try {
        return await this.primary.chatStream(messages, groundedContext, onChunk, onToolCall);
      } catch (err) {
        console.warn("⚠️ Live Gemini chatStream failed. Falling back to local engine:", err);
      }
    }
    return this.fallback.chatStream(messages, groundedContext, onChunk, onToolCall);
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    if (this.audioProvider) {
      try {
        const text = await this.audioProvider.transcribeAudio(audioBuffer, mimeType);
        if (text && text.trim().length > 0) {
          console.log(`🎙️ Successfully transcribed audio via Groq Whisper: "${text}"`);
          return text;
        }
      } catch (err) {
        console.warn("⚠️ Live Whisper audio transcription failed. Falling back to local engine:", err);
      }
    }
    return this.fallback.transcribeAudio(audioBuffer, mimeType);
  }
}

export const aiProvider = new ResilientAIProvider();
