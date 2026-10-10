import type {
  SpeechToTextProvider,
  VisionProvider,
  LLMProvider,
} from "./interfaces.js";
import type { ParsedMeal, ExtractedReportResponse } from "@hale/shared";

/**
 * Deterministic Fake AI Provider for unit tests, CI, and offline development.
 */
export class FakeAIProvider implements SpeechToTextProvider, VisionProvider, LLMProvider {
  async transcribeAudio(_audioBuffer: Buffer, _mimeType: string): Promise<string> {
    return "two rotis, yellow dal, and a bowl of curd";
  }

  async parseMealText(text: string, _context?: { timeOfDay?: string }): Promise<ParsedMeal> {
    const lower = text.toLowerCase();

    if (lower.includes("skip")) {
      return {
        mealType: "breakfast",
        items: [],
        totalKcal: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        confidence: "high",
        isFood: true,
        isSkipped: true,
        impactSummary: "Skipped meal recorded. Maintained daily log consistency.",
      };
    }

    if (lower.includes("not food") || lower.includes("car key") || lower.includes("laptop")) {
      return {
        mealType: "lunch",
        items: [],
        totalKcal: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        confidence: "low",
        isFood: false,
        isSkipped: false,
        clarifyingQuestion: "That doesn't appear to be food. Could you describe your meal?",
      };
    }

    // Default mock meal: 2 rotis, yellow dal, curd
    return {
      mealType: "lunch",
      items: [
        {
          name: "Roti / Chapati",
          quantity: 2,
          unit: "pieces",
          kcal: 240,
          proteinG: 6,
          carbsG: 44,
          fatG: 4,
          confidence: "high",
        },
        {
          name: "Yellow Toor Dal",
          quantity: 1,
          unit: "medium katori (150ml)",
          kcal: 180,
          proteinG: 11,
          carbsG: 26,
          fatG: 3,
          confidence: "high",
        },
        {
          name: "Plain Curd / Dahi",
          quantity: 1,
          unit: "small bowl (100g)",
          kcal: 100,
          proteinG: 11,
          carbsG: 6,
          fatG: 4,
          confidence: "high",
        },
      ],
      totalKcal: 520,
      proteinG: 28,
      carbsG: 76,
      fatG: 11,
      confidence: "high",
      isFood: true,
      isSkipped: false,
      impactSummary: "+520 kcal logged. 28g protein added toward daily target.",
    };
  }

  async parseMealImage(
    _imageBuffer: Buffer,
    _mimeType: string,
    _clientHint?: string
  ): Promise<ParsedMeal> {
    return this.parseMealText("two rotis and yellow dal");
  }

  async extractReportDocument(
    _fileBuffer: Buffer,
    _mimeType: string
  ): Promise<ExtractedReportResponse> {
    return {
      reportDate: "2026-09-12",
      labName: "Standard Diagnostic Health Lab",
      parameters: [
        {
          canonicalKey: "ldl_cholesterol",
          name: "LDL Cholesterol",
          value: 132,
          unit: "mg/dL",
          refLow: 50,
          refHigh: 99,
          status: "high",
          confidence: "high",
          needsReview: false,
        },
        {
          canonicalKey: "fasting_glucose",
          name: "Fasting Blood Glucose",
          value: 91,
          unit: "mg/dL",
          refLow: 70,
          refHigh: 99,
          status: "normal",
          confidence: "high",
          needsReview: false,
        },
        {
          canonicalKey: "vitamin_d",
          name: "Vitamin D (25-OH)",
          value: 19,
          unit: "ng/mL",
          refLow: 30,
          refHigh: 100,
          status: "low",
          confidence: "high",
          needsReview: false,
        },
        {
          canonicalKey: "hba1c",
          name: "HbA1c",
          value: 5.4,
          unit: "%",
          refLow: 4.0,
          refHigh: 5.6,
          status: "normal",
          confidence: "high",
          needsReview: false,
        },
      ],
      goalLinkedSuggestions: [
        {
          parameterKey: "ldl_cholesterol",
          parameterName: "LDL Cholesterol",
          habitTitle: "Swap 2 fried snacks a week for roasted chana or nuts",
          why: "Replacing saturated oils with soluble fiber supports healthy LDL clearance.",
          metric: "Saturated fat & whole food snacks",
        },
      ],
    };
  }

  async phraseInsight(
    _facts: Record<string, unknown>,
    candidateType: string
  ): Promise<{ text: string; why: string; tip?: string }> {
    if (candidateType === "protein_shortfall") {
      return {
        text: "You have 35g protein remaining before evening.",
        why: "Hitting your protein target preserves muscle while maintaining your fat-loss deficit.",
        tip: "A cup of Greek yogurt or paneer with dinner effortlessly closes the gap.",
      };
    }
    return {
      text: "Steady consistency is compounding your progress.",
      why: "Small daily habits create long-term metabolic health.",
      tip: "Take 10s to log your evening meal.",
    };
  }

  async chatStream(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    _groundedContext: Record<string, unknown>,
    onChunk: (delta: string) => void,
    onToolCall?: (toolName: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>
  ): Promise<string> {
    const lastMsg = messages[messages.length - 1]?.content.toLowerCase() ?? "";

    if ((lastMsg.includes("had") || lastMsg.includes("ate") || lastMsg.includes("log")) && onToolCall) {
      await onToolCall("log_meal", { text: lastMsg });
      const response = "I've parsed and logged that meal for you. Your daily progress rings have been updated!";
      onChunk(response);
      return response;
    }

    const reply = "You're doing great today! You have ~450 kcal and 32g protein remaining for dinner. Let me know if you'd like a quick high-protein dinner recommendation.";
    onChunk(reply);
    return reply;
  }
}

