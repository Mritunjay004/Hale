import type {
  SpeechToTextProvider,
  VisionProvider,
  LLMProvider,
} from "./interfaces.js";
import type { ParsedMeal, ExtractedReportResponse, MealItem } from "@hale/shared";

/**
 * Intelligent Deterministic AI Provider with dynamic heuristic food parser.
 * Works 100% offline and in test environments without external API keys or rate limits.
 */
export class FakeAIProvider implements SpeechToTextProvider, VisionProvider, LLMProvider {
  async transcribeAudio(_audioBuffer: Buffer, _mimeType: string): Promise<string> {
    return "two rotis, yellow dal, and a bowl of curd";
  }

  async parseMealText(text: string, _context?: { timeOfDay?: string }): Promise<ParsedMeal> {
    const lower = text.toLowerCase();

    // 1. Skipped meal detection
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

    // 2. Non-food rejection
    if (
      lower.includes("not food") ||
      lower.includes("car key") ||
      lower.includes("laptop") ||
      lower.includes("phone") ||
      lower.includes("wallet")
    ) {
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

    // 3. Dynamic food dictionary matching
    const items: MealItem[] = [];

    // Chicken / Poultry
    if (lower.includes("chicken")) {
      items.push({
        name: "Grilled / Cooked Chicken Breast",
        quantity: 150,
        unit: "g",
        kcal: 245,
        proteinG: 46,
        carbsG: 0,
        fatG: 5,
        confidence: "high",
      });
    }

    // Eggs
    if (lower.includes("egg")) {
      const match = lower.match(/(\d+)\s*egg/);
      const count = match && match[1] ? parseInt(match[1], 10) : 2;
      items.push({
        name: "Whole Egg(s)",
        quantity: count,
        unit: "eggs",
        kcal: count * 74,
        proteinG: count * 6.3,
        carbsG: count * 0.4,
        fatG: count * 5,
        confidence: "high",
      });
    }

    // Rice / Fried Rice
    if (lower.includes("fried rice") || lower.includes("rice")) {
      items.push({
        name: lower.includes("fried") ? "Egg / Veggie Fried Rice" : "Steamed Rice",
        quantity: 1,
        unit: "plate (200g)",
        kcal: lower.includes("fried") ? 320 : 260,
        proteinG: lower.includes("fried") ? 7 : 4.5,
        carbsG: lower.includes("fried") ? 52 : 56,
        fatG: lower.includes("fried") ? 9 : 0.8,
        confidence: "high",
      });
    }

    // Paneer
    if (lower.includes("paneer")) {
      items.push({
        name: "Fresh Paneer Cubes",
        quantity: 100,
        unit: "g",
        kcal: 265,
        proteinG: 18,
        carbsG: 4,
        fatG: 20,
        confidence: "high",
      });
    }

    // Roti / Chapati
    if (lower.includes("roti") || lower.includes("chapati")) {
      const match = lower.match(/(\d+)\s*(?:roti|chapati)/);
      const count = match && match[1] ? parseInt(match[1], 10) : 2;
      items.push({
        name: "Whole Wheat Roti",
        quantity: count,
        unit: "pieces",
        kcal: count * 120,
        proteinG: count * 3,
        carbsG: count * 22,
        fatG: count * 2,
        confidence: "high",
      });
    }

    // Dal / Lentils
    if (lower.includes("dal") || lower.includes("daal") || lower.includes("sambar")) {
      items.push({
        name: "Yellow Toor Dal",
        quantity: 1,
        unit: "medium katori (150ml)",
        kcal: 180,
        proteinG: 11,
        carbsG: 26,
        fatG: 3,
        confidence: "high",
      });
    }

    // Vegetables / Salad
    if (lower.includes("veg") || lower.includes("salad") || lower.includes("cucumber")) {
      items.push({
        name: "Mixed Vegetables / Salad",
        quantity: 1,
        unit: "bowl (120g)",
        kcal: 65,
        proteinG: 2.5,
        carbsG: 12,
        fatG: 1,
        confidence: "high",
      });
    }

    // Curd / Yogurt
    if (lower.includes("curd") || lower.includes("dahi") || lower.includes("yogurt")) {
      items.push({
        name: "Plain Curd / Dahi",
        quantity: 1,
        unit: "small bowl (100g)",
        kcal: 100,
        proteinG: 11,
        carbsG: 6,
        fatG: 4,
        confidence: "high",
      });
    }

    // Bread / Toast
    if (lower.includes("bread") || lower.includes("toast")) {
      items.push({
        name: "Brown Toast",
        quantity: 2,
        unit: "slices",
        kcal: 150,
        proteinG: 6,
        carbsG: 28,
        fatG: 2,
        confidence: "high",
      });
    }

    // Coffee / Tea
    if (lower.includes("coffee") || lower.includes("tea") || lower.includes("chai")) {
      items.push({
        name: lower.includes("coffee") ? "Coffee with Milk" : "Masala Chai",
        quantity: 1,
        unit: "cup (150ml)",
        kcal: 75,
        proteinG: 3,
        carbsG: 9,
        fatG: 3,
        confidence: "high",
      });
    }

    // Fallback if no specific keyword matched: parse as balanced meal based on user's exact input
    if (items.length === 0) {
      items.push({
        name: text.trim().slice(0, 40) || "Healthy Meal Portion",
        quantity: 1,
        unit: "portion",
        kcal: 380,
        proteinG: 18,
        carbsG: 46,
        fatG: 12,
        confidence: "medium",
      });
    }

    // Calculate totals
    const totalKcal = items.reduce((sum, it) => sum + it.kcal, 0);
    const totalProtein = Math.round(items.reduce((sum, it) => sum + it.proteinG, 0) * 10) / 10;
    const totalCarbs = Math.round(items.reduce((sum, it) => sum + it.carbsG, 0) * 10) / 10;
    const totalFat = Math.round(items.reduce((sum, it) => sum + it.fatG, 0) * 10) / 10;

    // Guess meal type from time of day or keywords
    let mealType: "breakfast" | "lunch" | "snack" | "dinner" = "lunch";
    if (lower.includes("breakfast") || lower.includes("morning") || lower.includes("egg") || lower.includes("poha") || lower.includes("oat")) {
      mealType = "breakfast";
    } else if (lower.includes("dinner") || lower.includes("night")) {
      mealType = "dinner";
    } else if (lower.includes("snack") || lower.includes("tea") || lower.includes("coffee")) {
      mealType = "snack";
    }

    return {
      mealType,
      items,
      totalKcal,
      proteinG: totalProtein,
      carbsG: totalCarbs,
      fatG: totalFat,
      confidence: "high",
      isFood: true,
      isSkipped: false,
      impactSummary: `+${totalKcal} kcal logged. ${totalProtein}g protein added toward daily target.`,
    };
  }

  async parseMealImage(
    _imageBuffer: Buffer,
    _mimeType: string,
    clientHint?: string
  ): Promise<ParsedMeal> {
    return this.parseMealText(clientHint || "two rotis, yellow dal, and curd");
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
    groundedContext: Record<string, unknown>,
    onChunk: (delta: string) => void,
    onToolCall?: (toolName: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>
  ): Promise<string> {
    const lastMsg = messages[messages.length - 1]?.content.toLowerCase() ?? "";

    // 1. Safety Guardrail: Extreme Calorie Restriction / Starvation
    if (
      lastMsg.includes("eat 500") ||
      lastMsg.includes("800 calorie") ||
      lastMsg.includes("starve") ||
      lastMsg.includes("extreme deficit")
    ) {
      const response =
        "As your clinical coach, I strongly advise against dropping below 1,200–1,500 kcal/day. Severe deficits cause your resting metabolic rate to downshift and lead to lean muscle wasting. Let's aim for a steady, sustainable 300–500 kcal deficit that keeps your energy elevated without metabolic adaptation.";
      onChunk(response);
      return response;
    }

    // 2. Safety Guardrail: Emergency / Prescription Medical Claims
    if (
      lastMsg.includes("chest pain") ||
      lastMsg.includes("insulin dose") ||
      lastMsg.includes("prescribe") ||
      lastMsg.includes("heart attack")
    ) {
      const response =
        "Please note: Hale is a wellness and nutritional assistant, not an emergency medical provider. If you are experiencing acute medical symptoms or need prescription adjustments, please contact emergency medical services or consult your primary healthcare physician immediately.";
      onChunk(response);
      return response;
    }

    // 3. Tool: Log Meal
    if (
      (lastMsg.includes("had") ||
        lastMsg.includes("ate") ||
        lastMsg.includes("log") ||
        lastMsg.includes("drank") ||
        lastMsg.includes("breakfast was") ||
        lastMsg.includes("lunch was") ||
        lastMsg.includes("dinner was")) &&
      onToolCall
    ) {
      const cleanText = lastMsg.replace(/^log\s*:?\s*/i, "");
      const toolRes = await onToolCall("log_meal", { text: cleanText });
      const summaryText = (toolRes as any)?.summary || "Meal successfully logged";
      const response = `I've logged that for you! ✨ ${summaryText}. Your daily calorie and protein rings on the Today screen have been updated.`;
      onChunk(response);
      return response;
    }

    // 4. Tool: Explain Biomarker
    if (
      lastMsg.includes("vitamin d") ||
      lastMsg.includes("hba1c") ||
      lastMsg.includes("ldl") ||
      lastMsg.includes("cholesterol") ||
      lastMsg.includes("glucose") ||
      lastMsg.includes("ferritin")
    ) {
      let key = "vitamin_d";
      if (lastMsg.includes("hba1c") || lastMsg.includes("a1c")) key = "hba1c";
      else if (lastMsg.includes("ldl") || lastMsg.includes("cholesterol")) key = "ldl_cholesterol";
      else if (lastMsg.includes("glucose") || lastMsg.includes("sugar")) key = "fasting_glucose";

      if (onToolCall) {
        await onToolCall("explain_biomarker", { biomarkerKey: key });
      }

      if (key === "vitamin_d") {
        const response =
          "Vitamin D (25-OH) is a critical pro-hormone that regulates calcium absorption and mitochondrial energy. When your levels are low (<30 ng/mL), you often experience afternoon fatigue (the 3 PM slump) and mood dips. Getting 15 minutes of direct morning sunlight and eating egg yolks or fortified dairy helps steadily restore normal vitality.";
        onChunk(response);
        return response;
      }

      if (key === "ldl_cholesterol") {
        const response =
          "LDL Cholesterol carries lipids through your bloodstream. Elevated LDL (>100 mg/dL) can accumulate in arterial walls over time. The most effective nutrition habit is increasing soluble fiber (oats, legumes, roasted chana) and swapping out hydrogenated frying oils.";
        onChunk(response);
        return response;
      }

      const response =
        "Biomarkers reflect your underlying metabolic state. Keeping them in their clinical reference range directly supports day-to-day energy, stable mood, and deep restorative sleep.";
      onChunk(response);
      return response;
    }

    // 5. Tool: Suggest Meal for Remaining Macros
    if (
      lastMsg.includes("what should i eat") ||
      lastMsg.includes("dinner") ||
      lastMsg.includes("suggest") ||
      lastMsg.includes("protein") ||
      lastMsg.includes("recommend")
    ) {
      const remainingProtein = (groundedContext as any)?.remainingProteinG ?? 32;
      const remainingKcal = (groundedContext as any)?.remainingKcal ?? 520;

      if (onToolCall) {
        await onToolCall("suggest_meal", {
          remainingKcal,
          remainingProteinG: remainingProtein,
        });
      }

      const response = `You currently have ~${remainingKcal} kcal and ${remainingProtein}g of protein remaining today. Here is a high-protein recommendation to hit your target effortlessly:

• 150g Grilled Paneer or Chicken Breast (28g Protein, ~240 kcal)
• 1 katori Yellow Moong / Toor Dal (7g Protein, ~130 kcal)
• 1 Whole Wheat Roti or 1 cup steamed brown rice (3g Protein, ~120 kcal)

This meal provides ~38g protein and fits perfectly within your target balance!`;
      onChunk(response);
      return response;
    }

    // Default grounded supportive answer
    const currentProtein = (groundedContext as any)?.currentProteinG ?? 45;
    const targetProtein = (groundedContext as any)?.targetProteinG ?? 95;
    const remainingKcal = (groundedContext as any)?.remainingKcal ?? 600;

    const reply = `You're tracking well today! You have consumed ${currentProtein}g / ${targetProtein}g protein so far, with ~${remainingKcal} kcal remaining. Would you like a dinner idea or need help explaining any lab markers?`;
    onChunk(reply);
    return reply;
  }
}
