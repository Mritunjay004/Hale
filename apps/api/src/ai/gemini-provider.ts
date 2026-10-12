import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LLMProvider, VisionProvider } from "./interfaces.js";
import {
  parsedMealSchema,
  extractedReportResponseSchema,
  CANONICAL_BIOMARKERS,
  matchCanonicalBiomarker,
  type ParsedMeal,
  type ExtractedReportResponse,
} from "@hale/shared";

export class GeminiAIProvider implements LLMProvider, VisionProvider {
  private client: GoogleGenerativeAI;
  private primaryModel: string;
  private candidateModels: string[];

  constructor(apiKey: string, modelName?: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.primaryModel = modelName ?? process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
    this.candidateModels = [
      this.primaryModel,
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
    ].filter((m, i, arr) => arr.indexOf(m) === i && !m.includes("3.8") && !m.includes("3.6") && !m.includes("3.5"));
  }

  /**
   * Parse meal text using Gemini with strict JSON schema.
   */
  async parseMealText(
    text: string,
    context?: { timeOfDay?: string | undefined; suggestedMealType?: string | undefined }
  ): Promise<ParsedMeal> {
    const systemInstruction = `You are an expert clinical nutritional assistant for the Hale Health app.
Parse the user's food description into nutritional items, estimating reasonable quantities, kcal, and macros (protein, carbs, fat in grams).
First-class support for Indian household portions:
- "katori" = 150ml
- "roti/chapati" = ~120 kcal, 3g P, 22g C, 2g F per medium piece
- "bowl" = ~200-250ml
- "cup" = ~240ml
- "spoon/tbsp" = ~15ml

If the input is NOT food/drink (e.g., "keys", "laptop", random conversation), set isFood: false, items: [], and provide a friendly clarifyingQuestion.
If the input mentions skipping a meal (e.g., "skipped breakfast"), set isSkipped: true, isFood: true, items: [], totalKcal: 0, proteinG: 0, carbsG: 0, fatG: 0.

Return JSON strictly adhering to this schema:
{
  "mealType": "breakfast" | "lunch" | "snack" | "dinner",
  "items": [
    {
      "name": string,
      "quantity": number,
      "unit": string,
      "kcal": number,
      "proteinG": number,
      "carbsG": number,
      "fatG": number,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "totalKcal": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "confidence": "high" | "medium" | "low",
  "isFood": boolean,
  "isSkipped": boolean,
  "clarifyingQuestion": string (optional),
  "impactSummary": string (optional, e.g. "+520 kcal logged. 28g protein added toward daily target.")
}`;

    const mealHint = context?.suggestedMealType
      ? `\nUser explicitly selected meal slot: "${context.suggestedMealType}" (please use mealType: "${context.suggestedMealType}" unless description clearly specifies another meal).`
      : "";
    const prompt = `User logged: "${text}"\nTime context: ${context?.timeOfDay ?? "now"}${mealHint}`;

    let lastError: unknown;
    for (const modelName of this.candidateModels) {
      try {
        const model = this.client.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
          systemInstruction,
        });

        const result = await model.generateContent(prompt);
        const jsonText = result.response.text();
        const fallbackMealType = (context?.suggestedMealType as any) || "lunch";
        const parsed = normalizeParsedMealJson(jsonText, fallbackMealType);
        console.log(`✅ Live Gemini call succeeded with model ${modelName}`);
        return parsed;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Gemini model ${modelName} failed (${msg}), trying next candidate...`);
      }
    }

    throw lastError;
  }

  async parseMealImage(
    imageBuffer: Buffer,
    mimeType: string,
    clientHint?: string,
    suggestedMealType?: string
  ): Promise<ParsedMeal> {
    const systemInstruction = `You are an expert clinical nutritional vision assistant for the Hale Health app.
Analyze the food, meal, beverage, dessert, or grocery items in the uploaded photograph.
Identify every visible food item, dish, sweet, beverage, or snack with high accuracy.

First-class support for Indian cuisine, sweets, and household portions:
- Identify Indian sweets and mithai accurately:
  * "Kaju Katli" / cashew fudge: standard diamond piece with silver vark is ~15-20g, ~50-60 kcal, ~1.2g protein, ~8g carbs, ~2.5g fat per piece. Estimate portions based on realistic consumption (e.g. 2-4 pieces for a typical serving, or total count if prominently displayed on a plate).
  * "Gulab Jamun": ~150 kcal, 2.5g P, 22g C, 6g F per piece.
  * "Rasgulla": ~125 kcal, 2.8g P, 25g C, 1.5g F per piece.
  * "Besan Laddu": ~180 kcal, 3.5g P, 24g C, 8g F per piece.
  * "Barfi" / "Peda": ~100-140 kcal per piece.
- Household items:
  * "katori" = 150ml (dal, curry, raita, curd)
  * "roti/chapati" = ~120 kcal, 3g P, 22g C, 2g F per medium piece
  * "bowl" = 200-250ml
  * "cup" = 240ml
- Western & global foods: estimate realistic portion and accurate macro breakdown.

If the photograph does NOT contain food, drink, or groceries (e.g., a person, landscape, furniture, electronics, animal, document), set isFood: false, items: [], totalKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, and provide a polite clarifyingQuestion asking for a food photo.

Return JSON strictly adhering to this schema:
{
  "mealType": "breakfast" | "lunch" | "snack" | "dinner",
  "items": [
    {
      "name": string,
      "quantity": number,
      "unit": string,
      "kcal": number,
      "proteinG": number,
      "carbsG": number,
      "fatG": number,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "totalKcal": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "confidence": "high" | "medium" | "low",
  "isFood": boolean,
  "isSkipped": boolean,
  "clarifyingQuestion": string (optional),
  "impactSummary": string (optional, e.g. "+220 kcal logged. 5g protein added toward daily target.")
}`;

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType,
      },
    };

    const hasValidHint =
      clientHint &&
      !["Food plate photograph", "Plate photo capture", "none"].includes(clientHint.trim());
    let prompt = hasValidHint
      ? `Identify the food plate in this image and parse the items and portions into nutritional values. User hint: "${clientHint}"`
      : `Identify all food items, dishes, sweets, or beverages in this image and parse into accurate nutritional values.`;
    if (suggestedMealType) {
      prompt += ` User selected meal slot: "${suggestedMealType}" (please use mealType: "${suggestedMealType}" unless visually certain it is another slot).`;
    }

    let lastError: unknown;
    for (const modelName of this.candidateModels) {
      try {
        const model = this.client.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
          systemInstruction,
        });

        const result = await model.generateContent([prompt, imagePart]);
        const jsonText = result.response.text();
        const fallbackMealType = (suggestedMealType as any) || "snack";
        const parsed = normalizeParsedMealJson(jsonText, fallbackMealType);
        console.log(`✅ Live Gemini Vision call succeeded with model ${modelName}`);
        return parsed;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Gemini Vision model ${modelName} failed (${msg}), trying next candidate...`);
      }
    }

    throw lastError;
  }

  async extractReportDocument(
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<ExtractedReportResponse> {
    const prompt = `You are a clinical pathology document extractor for the Hale Health app.
Extract all lab test names, test values (numbers only), units, and reference intervals (refLow, refHigh) found in this medical lab report / blood test document.
Also extract the report date (YYYY-MM-DD format, or today's date if missing) and the laboratory or clinic name if present.

Return JSON strictly adhering to this structure:
{
  "reportDate": "YYYY-MM-DD",
  "labName": string,
  "parameters": [
    {
      "name": string,
      "value": number,
      "unit": string,
      "refLow": number or null,
      "refHigh": number or null
    }
  ]
}`;

    // Normalize image or PDF mime type for Gemini
    const safeMimeType = mimeType.includes("pdf") ? "application/pdf" : (mimeType || "image/jpeg");
    const docPart = {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType: safeMimeType,
      },
    };

    let lastError: unknown;
    for (const modelName of this.candidateModels) {
      try {
        const model = this.client.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const result = await model.generateContent([prompt, docPart]);
        const jsonText = result.response.text();
        const rawData = JSON.parse(jsonText);

        const extractedParams = (rawData.parameters || []).map((p: any) => {
          const matched = matchCanonicalBiomarker(p.name);
          const canonicalKey = matched ? matched.key : null;
          const refLow = typeof p.refLow === "number" ? p.refLow : (matched ? matched.referenceRange.low : null);
          const refHigh = typeof p.refHigh === "number" ? p.refHigh : (matched ? matched.referenceRange.high : null);

          let status: "low" | "normal" | "high" | "unknown" = "unknown";
          if (typeof p.value === "number") {
            if (refLow !== null && p.value < refLow) status = "low";
            else if (refHigh !== null && p.value > refHigh) status = "high";
            else if (refLow !== null || refHigh !== null) status = "normal";
          }

          return {
            id: crypto.randomUUID(),
            canonicalKey,
            name: matched ? matched.name : p.name,
            value: Number(p.value) || 0,
            unit: p.unit || (matched ? matched.standardUnit : ""),
            refLow,
            refHigh,
            status,
            confidence: "high" as const,
            needsReview: !matched,
          };
        });

        // Fast deterministic goal-linked suggestions from local dictionary
        const goalLinkedSuggestions: Array<{
          parameterKey: string;
          parameterName: string;
          habitTitle: string;
          why: string;
          metric: string;
        }> = [];

        for (const param of extractedParams) {
          if (param.canonicalKey && param.status !== "normal" && param.status !== "unknown") {
            const biomarker = CANONICAL_BIOMARKERS[param.canonicalKey];
            if (biomarker) {
              const habit = param.status === "low"
                ? biomarker.goalLinkedHabits.whenLow ?? biomarker.goalLinkedHabits.whenHigh
                : biomarker.goalLinkedHabits.whenHigh ?? biomarker.goalLinkedHabits.whenLow;

              if (habit) {
                goalLinkedSuggestions.push({
                  parameterKey: biomarker.key,
                  parameterName: biomarker.name,
                  habitTitle: habit.title,
                  why: `${biomarker.name} was ${param.status} in your report. ${habit.why}`,
                  metric: habit.metric,
                });
              }
            }
          }
        }

        const reportResponse: ExtractedReportResponse = {
          reportDate: rawData.reportDate || new Date().toISOString().split("T")[0]!,
          labName: rawData.labName || "Diagnostic Lab",
          parameters: extractedParams,
          rawSummary: `Extracted ${extractedParams.length} biomarker tests from document.`,
          goalLinkedSuggestions,
        };

        const validated = extractedReportResponseSchema.parse(reportResponse);
        console.log(`✅ Live Gemini report extraction succeeded with model ${modelName} (${extractedParams.length} parameters)`);
        return validated;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Gemini model ${modelName} failed on report extraction (${msg}), trying next candidate...`);
      }
    }

    throw lastError;
  }

  async phraseInsight(
    facts: Record<string, unknown>,
    candidateType: string
  ): Promise<{ text: string; why: string; tip?: string }> {
    const model = this.client.getGenerativeModel({
      model: this.primaryModel,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `Phrase this insight for a user in 2 empathetic, non-shaming sentences.
Candidate Type: ${candidateType}
Facts: ${JSON.stringify(facts)}
Return JSON: { "text": string, "why": string, "tip": string }`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  }

  async chatStream(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    groundedContext: Record<string, unknown>,
    onChunk: (delta: string) => void,
    onToolCall?: (toolName: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>
  ): Promise<string> {
    const rawMsg = messages[messages.length - 1]?.content ?? "Hello";
    const isQuestionOrInquiry =
      /\?|\b(explain|how can|how to|what is|how do|why|suggest|recommend|tell me|routine swaps|food swaps|can you)\b/i.test(rawMsg);

    const isMealLogIntent =
      !isQuestionOrInquiry &&
      (/\b(i had|i ate|\bate\b|\bdrank\b|i drank)\b/i.test(rawMsg) ||
        /^log\b/i.test(rawMsg.trim()) ||
        /\b(breakfast was|lunch was|dinner was|snack was)\b/i.test(rawMsg));

    if (isMealLogIntent && onToolCall) {
      const cleanText = rawMsg.replace(/^log\s*:?\s*/i, "");
      const toolRes = await onToolCall("log_meal", { text: cleanText });
      if ((toolRes as any)?.success) {
        const summaryText = (toolRes as any)?.summary || "Meal successfully logged";
        const reply = `I've logged that for you! ✨ ${summaryText}. Your daily calorie and protein rings on the Today screen have been updated.`;
        onChunk(reply);
        return reply;
      }
    }

    const systemInstruction = `You are an expert clinical nutritional assistant for the Hale Health app.
Be empathetic, motivating, and concise (max 3 short paragraphs).
You have access to the user's live profile, today's targets, consumed totals, and lab reports:
${JSON.stringify(groundedContext, null, 2)}

Safety Guardrails:
1. If the user asks for extreme calorie deficits (< 1200 kcal for women, < 1500 kcal for men), provide kind clinical pushback explaining metabolic adaptation.
2. If the user asks about emergency conditions or prescription drug dosages, provide a safe medical disclaimer.

Indian Portions context:
- Katori = 150ml
- Medium roti = ~120 kcal, 3g P, 22g C, 2g F
- Cup = 240ml`;

    let lastError: unknown;
    for (const modelName of this.candidateModels) {
      try {
        const model = this.client.getGenerativeModel({
          model: modelName,
          systemInstruction,
        });

        const prompt = `User query: "${rawMsg}"\nLive Context: ${JSON.stringify(groundedContext)}`;
        const result = await model.generateContentStream(prompt);
        let fullText = "";
        for await (const chunk of result.stream) {
          const text = chunk.text();
          fullText += text;
          onChunk(text);
        }
        if (fullText.trim().length > 0) {
          return fullText;
        }
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Gemini chat model ${modelName} failed (${msg}), trying next candidate...`);
      }
    }

    throw lastError || new Error("Gemini chatStream failed for all candidate models");
  }
}

/**
 * Normalizes and sanitizes JSON returned by LLM/Vision models to guarantee compliance
 * with parsedMealSchema (filling missing macro keys, computing sums, and mapping synonyms).
 */
export function normalizeParsedMealJson(
  rawInput: string | Record<string, unknown>,
  defaultMealType: "breakfast" | "lunch" | "snack" | "dinner" = "snack"
): ParsedMeal {
  let obj: Record<string, any>;
  if (typeof rawInput === "string") {
    const cleaned = rawInput.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
    obj = JSON.parse(cleaned);
  } else {
    obj = { ...rawInput };
  }

  // Meal Type validation
  const validMealTypes = ["breakfast", "lunch", "snack", "dinner"];
  if (!obj.mealType || !validMealTypes.includes(String(obj.mealType).toLowerCase())) {
    obj.mealType = defaultMealType;
  } else {
    obj.mealType = String(obj.mealType).toLowerCase();
  }

  // Boolean flags
  obj.isFood = obj.isFood !== false;
  obj.isSkipped = Boolean(obj.isSkipped);

  if (obj.clarifyingQuestion === null || obj.clarifyingQuestion === undefined) {
    delete obj.clarifyingQuestion;
  }
  if (obj.impactSummary === null || obj.impactSummary === undefined) {
    delete obj.impactSummary;
  }

  // Items normalization
  const rawItems = Array.isArray(obj.items) ? obj.items : [];
  const normalizedItems: Array<{
    name: string;
    quantity: number;
    unit: string;
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    confidence: "high" | "medium" | "low";
  }> = [];

  for (const it of rawItems) {
    if (!it || typeof it !== "object") continue;

    const name = String(it.name || it.item || it.food || it.food_name || "Food Item").trim();
    const rawQty = Number(it.quantity ?? it.qty ?? it.portion ?? it.count ?? 1);
    const quantity = isNaN(rawQty) || rawQty <= 0 ? 1 : Math.round(rawQty * 10) / 10;
    const unit = String(it.unit || it.serving_unit || "portion").trim();

    // Calories: support kcal, calories, calorie, energy
    const rawKcal = Number(it.kcal ?? it.calories ?? it.calorie ?? it.energy ?? 0);
    const kcal = isNaN(rawKcal) || rawKcal < 0 ? 0 : Math.round(rawKcal);

    // Protein: support proteinG, protein, protein_g
    const rawProtein = Number(it.proteinG ?? it.protein ?? it.protein_g ?? 0);
    const proteinG = isNaN(rawProtein) || rawProtein < 0 ? 0 : Math.round(rawProtein * 10) / 10;

    // Carbs: support carbsG, carbs, carbohydrates, carbs_g
    const rawCarbs = Number(it.carbsG ?? it.carbs ?? it.carbohydrates ?? it.carbs_g ?? 0);
    const carbsG = isNaN(rawCarbs) || rawCarbs < 0 ? 0 : Math.round(rawCarbs * 10) / 10;

    // Fat: support fatG, fat, fat_g, fats
    const rawFat = Number(it.fatG ?? it.fat ?? it.fat_g ?? it.fats ?? 0);
    const fatG = isNaN(rawFat) || rawFat < 0 ? 0 : Math.round(rawFat * 10) / 10;

    const confidenceVal = String(it.confidence || "high").toLowerCase();
    const confidence = ["high", "medium", "low"].includes(confidenceVal)
      ? (confidenceVal as "high" | "medium" | "low")
      : "high";

    normalizedItems.push({
      name,
      quantity,
      unit,
      kcal,
      proteinG,
      carbsG,
      fatG,
      confidence,
    });
  }

  obj.items = normalizedItems;

  // Calculate totals
  const sumKcal = normalizedItems.reduce((acc, i) => acc + i.kcal, 0);
  const sumProtein = Math.round(normalizedItems.reduce((acc, i) => acc + i.proteinG, 0) * 10) / 10;
  const sumCarbs = Math.round(normalizedItems.reduce((acc, i) => acc + i.carbsG, 0) * 10) / 10;
  const sumFat = Math.round(normalizedItems.reduce((acc, i) => acc + i.fatG, 0) * 10) / 10;

  const rawTotalKcal = Number(obj.totalKcal ?? obj.calories ?? sumKcal);
  obj.totalKcal = isNaN(rawTotalKcal) || rawTotalKcal < 0 ? sumKcal : Math.round(rawTotalKcal);

  const rawTotalProtein = Number(obj.proteinG ?? obj.protein ?? sumProtein);
  obj.proteinG = isNaN(rawTotalProtein) || rawTotalProtein < 0 ? sumProtein : Math.round(rawTotalProtein * 10) / 10;

  const rawTotalCarbs = Number(obj.carbsG ?? obj.carbs ?? sumCarbs);
  obj.carbsG = isNaN(rawTotalCarbs) || rawTotalCarbs < 0 ? sumCarbs : Math.round(rawTotalCarbs * 10) / 10;

  const rawTotalFat = Number(obj.fatG ?? obj.fat ?? sumFat);
  obj.fatG = isNaN(rawTotalFat) || rawTotalFat < 0 ? sumFat : Math.round(rawTotalFat * 10) / 10;

  const rootConfidence = String(obj.confidence || "high").toLowerCase();
  obj.confidence = ["high", "medium", "low"].includes(rootConfidence)
    ? rootConfidence
    : "high";

  if (!obj.impactSummary && obj.totalKcal > 0) {
    obj.impactSummary = `+${obj.totalKcal} kcal logged. ${obj.proteinG}g protein added toward daily target.`;
  }

  return parsedMealSchema.parse(obj);
}


