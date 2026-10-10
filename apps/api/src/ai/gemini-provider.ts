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
    this.primaryModel = modelName ?? process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
    this.candidateModels = [
      this.primaryModel,
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
    ].filter((m, i, arr) => arr.indexOf(m) === i);
  }

  /**
   * Parse meal text using Gemini with strict JSON schema.
   */
  async parseMealText(
    text: string,
    context?: { timeOfDay?: string }
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

    const prompt = `User logged: "${text}"\nTime context: ${context?.timeOfDay ?? "now"}`;

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
        const rawObj = JSON.parse(jsonText);
        if (rawObj.clarifyingQuestion === null) delete rawObj.clarifyingQuestion;
        if (rawObj.impactSummary === null) delete rawObj.impactSummary;
        if (rawObj.isFood === undefined || rawObj.isFood === null) rawObj.isFood = true;
        if (rawObj.isSkipped === undefined || rawObj.isSkipped === null) rawObj.isSkipped = false;
        if (Array.isArray(rawObj.items)) {
          for (const item of rawObj.items) {
            if (item.alternatives === null) delete item.alternatives;
          }
        }
        const parsed = parsedMealSchema.parse(rawObj);
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
    clientHint?: string
  ): Promise<ParsedMeal> {
    const model = this.client.getGenerativeModel({
      model: this.primaryModel,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType,
      },
    };

    const prompt = `Identify the food plate in this image and parse the items and portions into nutritional values. Hint: ${clientHint ?? "none"}`;
    const result = await model.generateContent([prompt, imagePart]);
    const jsonText = result.response.text();
    return parsedMealSchema.parse(JSON.parse(jsonText));
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
    onChunk: (delta: string) => void
  ): Promise<string> {
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

    const model = this.client.getGenerativeModel({
      model: this.primaryModel,
      systemInstruction,
    });

    const lastMsg = messages[messages.length - 1]?.content ?? "Hello";
    const result = await model.generateContentStream(lastMsg);
    let fullText = "";
    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullText += text;
      onChunk(text);
    }
    return fullText;
  }
}

