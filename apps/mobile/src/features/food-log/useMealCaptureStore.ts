import { create } from "zustand";
import type { ParsedMeal, MealSource } from "@hale/shared";

interface MealCaptureState {
  isOpen: boolean;
  suggestedMealType?: string;
  parsedMeal: ParsedMeal | null;
  mealSource: MealSource;
  rawInput?: string;
  openCapture: (suggestedMealType?: string) => void;
  closeCapture: () => void;
  setParsed: (meal: ParsedMeal, source: MealSource, raw?: string) => void;
  resetToCapture: () => void;
}

export const useMealCaptureStore = create<MealCaptureState>((set) => ({
  isOpen: false,
  suggestedMealType: undefined,
  parsedMeal: null,
  mealSource: "voice",
  rawInput: undefined,
  openCapture: (suggestedMealType) =>
    set({ isOpen: true, suggestedMealType, parsedMeal: null }),
  closeCapture: () => set({ isOpen: false, parsedMeal: null }),
  setParsed: (parsedMeal, mealSource, rawInput) =>
    set({ parsedMeal, mealSource, rawInput }),
  resetToCapture: () => set({ parsedMeal: null }),
}));

