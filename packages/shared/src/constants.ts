/**
 * Global Constants for the Personal Health Assistant
 * The application name is defined in one central constant so it can be rebranded in minutes.
 */
export const APP_NAME = "Hale" as const;

/**
 * Physiological & Nutritional Constraints
 */
export const NUTRITION_LIMITS = {
  // Absolute minimum daily caloric intake for health & metabolic safety
  CALORIE_FLOOR_FEMALE: 1200,
  CALORIE_FLOOR_MALE: 1500,

  // Maximum safe weekly weight change rate
  MAX_SAFE_WEIGHT_LOSS_KG_PER_WEEK: 1.0, // ~1% bodyweight cap
  DEFAULT_SAFE_WEIGHT_LOSS_KG_PER_WEEK: 0.4, // Sustainable default

  // Kcal per kg of body fat (approximate standard metabolic equivalent: ~7,700 kcal / kg)
  KCAL_PER_KG_FAT: 7700,

  // Activity level multipliers for TDEE computation (Mifflin-St Jeor)
  ACTIVITY_MULTIPLIERS: {
    sedentary: 1.2, // Little or no intentional exercise, desk job
    lightly_active: 1.375, // Light exercise 1-3 days/week
    moderately_active: 1.55, // Moderate exercise 3-5 days/week
    very_active: 1.725, // Hard exercise 6-7 days/week or physical job
  },

  // Grams to calories conversion
  KCAL_PER_GRAM_PROTEIN: 4,
  KCAL_PER_GRAM_CARB: 4,
  KCAL_PER_GRAM_FAT: 9,

  // Recommended protein target ranges (grams per kg of bodyweight)
  PROTEIN_TARGET_G_PER_KG: {
    fat_loss: 1.6, // High protein protects lean mass in a deficit
    muscle_gain: 1.8,
    maintenance: 1.2,
    eat_healthier: 1.2,
  },
} as const;

/**
 * Habit Tracking Defaults
 */
export const HABIT_DEFAULTS = {
  MIN_MEALS_FOR_DAY_COMPLETE: 2,
  GRACE_DAYS_PER_WEEK: 1, // 1 rest/grace day allowed per rolling 7 days without breaking streak
} as const;

