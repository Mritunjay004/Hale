import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeminiAIProvider } from "../src/ai/gemini-provider.js";

const { getGenerativeModel, generateContentStream, generateContent } = vi.hoisted(() => ({
  getGenerativeModel: vi.fn(),
  generateContentStream: vi.fn(),
  generateContent: vi.fn(),
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel = getGenerativeModel;
  },
}));

function streamingReply(...chunks: string[]) {
  return {
    stream: (async function* () {
      for (const text of chunks) yield { text: () => text };
    })(),
  };
}

const question = [{ role: "user" as const, content: "Can you suggest food swaps?" }];

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("GEMINI_MODEL", "");
  getGenerativeModel.mockReturnValue({ generateContentStream, generateContent });
  generateContentStream.mockResolvedValue(streamingReply("Try whole grains. ", "Add some dal."));
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("Gemini coach model selection", () => {
  it.each([undefined, "", "  ", "gemini-3.8-flash"])(
    "streams a live reply with the supported default for %s",
    async (modelName) => {
      const chunks: string[] = [];
      const provider = new GeminiAIProvider("test-key", modelName);

      const reply = await provider.chatStream(question, {}, (chunk) => chunks.push(chunk));

      expect(getGenerativeModel).toHaveBeenCalledTimes(1);
      expect(getGenerativeModel).toHaveBeenCalledWith(expect.objectContaining({ model: "gemini-3.8-flash" }));
      expect(chunks.join("")).toBe(reply);
      expect(reply).toBe("Try whole grains. Add some dal.");
    }
  );

  it.each(["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", " models/gemini-2.0-flash-001 "])(
    "upgrades retired deployment model %s before making a request",
    async (modelName) => {
      vi.stubEnv("GEMINI_MODEL", modelName);
      await new GeminiAIProvider("test-key").chatStream(question, {}, vi.fn());

      expect(getGenerativeModel).toHaveBeenCalledTimes(1);
      expect(getGenerativeModel).toHaveBeenCalledWith(expect.objectContaining({ model: "gemini-3.8-flash" }));
    }
  );

  it("honors a supported explicit model override", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-3.8-flash");
    await new GeminiAIProvider("test-key", " models/gemini-3.6-flash ").chatStream(question, {}, vi.fn());

    expect(getGenerativeModel).toHaveBeenCalledWith(expect.objectContaining({ model: "gemini-3.6-flash" }));
  });

  it("retries a supported fallback when the primary model is unavailable", async () => {
    generateContentStream.mockRejectedValueOnce(Object.assign(new Error("Not Found"), { status: 404 }));
    const chunks: string[] = [];

    const reply = await new GeminiAIProvider("test-key").chatStream(question, {}, (chunk) => chunks.push(chunk));

    expect(getGenerativeModel.mock.calls.map(([options]) => options.model)).toEqual([
      "gemini-3.8-flash",
      "gemini-3.5-flash-lite",
    ]);
    expect(chunks.join("")).toBe(reply);
    expect(reply).toContain("Try whole grains.");
  });

  it("propagates failure after exhausting live models so the local provider can respond", async () => {
    generateContentStream.mockRejectedValue(new Error("Service unavailable"));

    await expect(new GeminiAIProvider("test-key").chatStream(question, {}, vi.fn()))
      .rejects.toThrow("Service unavailable");
    expect(getGenerativeModel).toHaveBeenCalledTimes(2);
  });

  it("also uses the supported model for meal parsing", async () => {
    generateContent.mockResolvedValue({
      response: { text: () => JSON.stringify({ mealType: "lunch", items: [] }) },
    });

    await new GeminiAIProvider("test-key", "gemini-1.5-flash").parseMealText("skipped lunch");

    expect(getGenerativeModel).toHaveBeenCalledWith(expect.objectContaining({ model: "gemini-3.8-flash" }));
  });
});

describe("API Gemini environment configuration", () => {
  it.each(["", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-3.8-flash"])(
    "resolves deployment setting %s to the current default",
    async (modelName) => {
      vi.resetModules();
      vi.stubEnv("GEMINI_MODEL", modelName);
      vi.stubEnv("AI_PROVIDER", "gemini");
      vi.stubEnv("GEMINI_API_KEY", "test-key");
      const { config } = await import("../src/infra/config.js");

      expect(config.GEMINI_MODEL).toBe("gemini-3.8-flash");
      expect(config.AI_PROVIDER).toBe("gemini");
    }
  );

  it("keeps coach replies available through the local provider if all live models fail", async () => {
    vi.resetModules();
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    generateContentStream.mockRejectedValue(new Error("Service unavailable"));
    const { aiProvider } = await import("../src/ai/factory.js");
    const chunks: string[] = [];

    const reply = await aiProvider.chatStream(
      [{ role: "user", content: "Suggest refined carbohydrate and saturated fat swaps?" }],
      {},
      (chunk) => chunks.push(chunk)
    );

    expect(reply).toContain("Refined Carbs Swaps");
    expect(reply).toContain("Saturated Fat Swaps");
    expect(chunks.join("")).toBe(reply);
    expect(getGenerativeModel).toHaveBeenCalledTimes(2);
  });
});
