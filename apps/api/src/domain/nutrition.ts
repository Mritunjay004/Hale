import {
  NUTRITION_LIMITS,
  type Sex,
  type ActivityLevel,
  type FocusHabit,
  type PlanRequestInput,
  type PlanResponse,
  type Pushback,
} from "@hale/shared";

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor formula.
 * Men: (10 × weight [kg]) + (6.25 × height [cm]) - (5 × age) + 5
 * Women: (10 × weight [kg]) + (6.25 × height [cm]) - (5 × age) - 161
 */
export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? Math.round(base + 5) : Math.round(base - 161);
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = NUTRITION_LIMITS.ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(bmr * multiplier);
}

/**
 * Pure domain function to compute a personalized nutritional plan and focus habits,
 * including health safety guardrails and pushback against aggressive targets.
 */
export function calculatePlan(input: PlanRequestInput): PlanResponse {
  const bmr = calculateBMR(input.weightKg, input.heightCm, input.age, input.sex);
  const tdee = calculateTDEE(bmr, input.activityLevel);

  const calorieFloor =
    input.sex === "male"
      ? NUTRITION_LIMITS.CALORIE_FLOOR_MALE
      : NUTRITION_LIMITS.CALORIE_FLOOR_FEMALE;

  let calorieTarget = tdee;
  let whyText = "";
  let pushback: Pushback | undefined;

  // 1. Goal-specific adjustments
  if (input.goalType === "fat_loss") {
    const targetWeightKg = input.targetWeightKg ?? input.weightKg - 5;
    const weightToLoseKg = Math.max(0, input.weightKg - targetWeightKg);

    // Evaluate requested timeframe pace
    let requestedWeeks = input.targetWeeks ?? Math.ceil(weightToLoseKg / NUTRITION_LIMITS.DEFAULT_SAFE_WEIGHT_LOSS_KG_PER_WEEK);
    if (requestedWeeks <= 0) requestedWeeks = 1;

    const requestedRateKgPerWeek = weightToLoseKg / requestedWeeks;

    // Pushback if rate exceeds safe ceiling (1.0 kg/week)
    if (requestedRateKgPerWeek > NUTRITION_LIMITS.MAX_SAFE_WEIGHT_LOSS_KG_PER_WEEK && weightToLoseKg > 0) {
      const safeWeeks = Math.ceil(weightToLoseKg / NUTRITION_LIMITS.DEFAULT_SAFE_WEIGHT_LOSS_KG_PER_WEEK);
      const proposedDate = new Date();
      proposedDate.setDate(proposedDate.getDate() + safeWeeks * 7);

      pushback = {
        triggered: true,
        reason: `Losing ${weightToLoseKg.toFixed(1)} kg in ${requestedWeeks} weeks would require an unsafe pace of ${requestedRateKgPerWeek.toFixed(1)} kg/week.`,
        requestedRateKgPerWeek: Math.round(requestedRateKgPerWeek * 10) / 10,
        safeRateKgPerWeek: NUTRITION_LIMITS.DEFAULT_SAFE_WEIGHT_LOSS_KG_PER_WEEK,
        proposedTargetDate: proposedDate.toISOString().split("T")[0]!,
        proposedWeeks: safeWeeks,
      };
    }

    // Daily deficit calculation: ~7,700 kcal per kg of fat loss
    // Cap deficit at 25% of TDEE to preserve thyroid & metabolic rate
    const desiredWeeklyLoss = Math.min(
      requestedRateKgPerWeek,
      NUTRITION_LIMITS.DEFAULT_SAFE_WEIGHT_LOSS_KG_PER_WEEK
    );
    const dailyDeficit = Math.min(
      Math.round((desiredWeeklyLoss * NUTRITION_LIMITS.KCAL_PER_KG_FAT) / 7),
      Math.round(tdee * 0.25)
    );

    calorieTarget = Math.max(tdee - dailyDeficit, calorieFloor);

    const actualDeficit = tdee - calorieTarget;
    const weeklyRate = Math.round(((actualDeficit * 7) / NUTRITION_LIMITS.KCAL_PER_KG_FAT) * 10) / 10;
    whyText = `Your body burns ~${tdee} kcal/day. A ${actualDeficit} kcal gap lets you lose ~${weeklyRate} kg/week safely while keeping energy and metabolism steady.`;
  } else if (input.goalType === "muscle_gain") {
    // Gentle 10-15% surplus
    const surplus = Math.round(tdee * 0.12);
    calorieTarget = tdee + surplus;
    whyText = `Your body burns ~${tdee} kcal/day. A slight surplus of ${surplus} kcal fuels resistance training and clean lean muscle growth.`;
  } else if (input.goalType === "maintenance") {
    calorieTarget = tdee;
    whyText = `Your body burns ~${tdee} kcal/day. Eating at maintenance preserves your current weight and body composition.`;
  } else {
    // Eat healthier
    calorieTarget = tdee;
    whyText = `Your body burns ~${tdee} kcal/day. Focus is on nutrient density, gut health, and whole foods rather than caloric restriction.`;
  }

  // 2. Macronutrient distributions
  const proteinGPerKg =
    NUTRITION_LIMITS.PROTEIN_TARGET_G_PER_KG[input.goalType] ?? 1.4;
  const proteinG = Math.round(input.weightKg * proteinGPerKg);
  const proteinKcal = proteinG * NUTRITION_LIMITS.KCAL_PER_GRAM_PROTEIN;

  // Fats: ~25-30% of total calories for hormonal health
  const fatCalories = calorieTarget * 0.28;
  const fatG = Math.round(fatCalories / NUTRITION_LIMITS.KCAL_PER_GRAM_FAT);

  // Carbs: remainder
  const carbCalories = Math.max(0, calorieTarget - (proteinKcal + fatG * NUTRITION_LIMITS.KCAL_PER_GRAM_FAT));
  const carbsG = Math.round(carbCalories / NUTRITION_LIMITS.KCAL_PER_GRAM_CARB);

  // 3. 3 Core Focus Habits (WHAT, WHY, HOW MEASURED)
  const focusHabits: FocusHabit[] = [
    {
      type: "protein_target",
      title: `Hit ~${proteinG}g protein daily`,
      why:
        input.goalType === "fat_loss"
          ? "In a calorie deficit, protein protects muscle tissue so the weight you lose is pure fat."
          : "Adequate protein repairs muscle fibers and supports daily immune function.",
      metric: "Tracked automatically from logged meals",
      target: proteinG,
      source: "onboarding",
      active: true,
    },
    {
      type: "daily_logging",
      title: "Log meals consistently",
      why: "Studies show people who log their meals consistently achieve 2x greater progress.",
      metric: "Daily habit streak",
      source: "onboarding",
      active: true,
    },
    {
      type: "dinner_balance",
      title: "Balanced evening meal",
      why: "Keeping dinner moderate improves deep sleep quality and morning insulin sensitivity.",
      metric: "Evening calorie distribution",
      source: "onboarding",
      active: true,
    },
  ];

  return {
    bmr,
    tdee,
    calorieTarget,
    proteinG,
    carbsG,
    fatG,
    whyText,
    focusHabits,
    pushback,
  };
}

