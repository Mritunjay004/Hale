import { create } from "zustand";
import type {
  GoalType,
  ActivityLevel,
  DietPreference,
  Sex,
  PlanResponse,
} from "@hale/shared";

export interface OnboardingState {
  // Step tracker
  step: number;
  
  // Form values
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  useImperial: boolean; // toggle for UI display
  
  goalType: GoalType;
  targetWeightKg?: number;
  targetWeeks?: number;
  
  activityLevel: ActivityLevel;
  dietPreference: DietPreference;
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
  sex: "male" as Sex,
  heightCm: 175,
  weightKg: 75,
  useImperial: false,
  goalType: "fat_loss" as GoalType,
  targetWeightKg: 70,
  targetWeeks: 12,
  activityLevel: "lightly_active" as ActivityLevel,
  dietPreference: "none" as DietPreference,
  notesTags: [] as string[],
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

