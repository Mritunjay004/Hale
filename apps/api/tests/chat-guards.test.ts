import { describe, it, expect, vi } from "vitest";
import { FakeAIProvider } from "../src/ai/fake-provider.js";

describe("Chat & Meal Logging Guards", () => {
  const provider = new FakeAIProvider();

  it("does not treat coach habit questions as food logs", async () => {
    const questionText =
      "Coach, can you explain how I can 'reduce refined carbohydrates and saturated fats' based on my lab report findings, and suggest practical food and routine swaps?";
    
    const parsed = await provider.parseMealText(questionText);
    expect(parsed.isFood).toBe(false);
    expect(parsed.totalKcal).toBe(0);
    expect(parsed.items).toHaveLength(0);
  });

  it("provides clinical habit guidance instead of logging a meal on coaching questions", async () => {
    const toolCallMock = vi.fn();
    const chunks: string[] = [];

    const response = await provider.chatStream(
      [
        {
          role: "user",
          content:
            "coach, can you explain how i can 'reduce refined carbohydrates and saturated fats' based on my lab report findings, and suggest practical food and routine swaps?",
        },
      ],
      {},
      (chunk) => chunks.push(chunk),
      toolCallMock
    );

    // Should NOT call log_meal tool
    expect(toolCallMock).not.toHaveBeenCalled();
    // Should return guidance on refined carbs and saturated fats
    expect(response).toContain("Refined Carbs Swaps");
    expect(response).toContain("Saturated Fat Swaps");
  });

  it("triggers log_meal tool only on genuine, explicit food logging phrases", async () => {
    const toolCallMock = vi.fn().mockResolvedValue({
      success: true,
      summary: "+380 kcal, 18g protein logged",
    });
    const chunks: string[] = [];

    const response = await provider.chatStream(
      [
        {
          role: "user",
          content: "I had 2 rotis and yellow dal for dinner",
        },
      ],
      {},
      (chunk) => chunks.push(chunk),
      toolCallMock
    );

    expect(toolCallMock).toHaveBeenCalledWith("log_meal", expect.anything());
    expect(response).toContain("I've logged that for you!");
  });
});

