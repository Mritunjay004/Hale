import { create } from "zustand";
import type { PlanRequestInput, PlanResponse } from "@hale/shared";

export interface OnboardingState {
  // Step tracker
  step: number;
  
  // Form values
  age: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  useImperial: boolean; // toggle for UI display
  
  goalType: "fat_loss" | "maintain" | "muscle" | "health";
  targetWeightKg?: number;
  timeframeWeeks?: number;
  
  activityLevel: "sedentary" | "light" | "moderate" | "heavy";
  dietPreference: "veg" | "non_veg" | "vegan" | "eggetarian" | "none";
  notesTags: string[];
  
  // Computed Plan & Pushback
  calculatedPlan: PlanResponse | null;
  acceptedPushbackDate: string | null;
  isLoadingPlan: boolean;
  
  // Actions
  setStep: (step: number) => void;
  updateData: (data: Partial<OnboardingState>) => void;
  toggleTag: (tag: string) => void;
  setCalculatedPlan: (plan: PlanResponse | null) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  age: 28,
  sex: "male" as const,
  heightCm: 175,
  weightKg: 75,
  useImperial: false,
  goalType: "fat_loss" as const,
  targetWeightKg: 70,
  timeframeWeeks: 12,
  activityLevel: "light" as const,
  dietPreference: "none" as const,
  notesTags: [],
  calculatedPlan: null,
  acceptedPushbackDate: null,
  isLoadingPlan: false,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  updateData: (data) => set((state) => ({ ...state, ...data })),
  toggleTag: (tag) =>
    set((state) => {
      const exists = state.notesTags.includes(tag);
      return {
        notesTags: exists
          ? state.notesTags.filter((t) => t !== tag)
          : [...state.notesTags, tag],
      };
    }),
  setCalculatedPlan: (plan) => set({ calculatedPlan: plan }),
  reset: () => set(initialState),
}));

