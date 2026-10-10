import {
  pgTable,
  text,
  timestamp,
  integer,
  doublePrecision,
  boolean,
  jsonb,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Users Table
 * Anonymous, device-bound user accounts
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deviceSecretHash: text("device_secret_hash").notNull().unique(),
    timezone: text("timezone").notNull().default("UTC"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    secretIdx: index("users_device_secret_idx").on(table.deviceSecretHash),
  })
);

/**
 * Profiles Table
 * Health profile, biometric baselines, calorie/macro targets
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    age: integer("age").notNull(),
    sex: text("sex", { enum: ["male", "female"] }).notNull(),
    heightCm: doublePrecision("height_cm").notNull(),
    weightKg: doublePrecision("weight_kg").notNull(),
    activityLevel: text("activity_level", {
      enum: ["sedentary", "lightly_active", "moderately_active", "very_active"],
    }).notNull(),
    dietPreference: text("diet_preference", {
      enum: ["none", "vegetarian", "non_vegetarian", "vegan", "eggetarian"],
    })
      .notNull()
      .default("none"),
    goalType: text("goal_type", {
      enum: ["fat_loss", "muscle_gain", "maintenance", "eat_healthier"],
    }).notNull(),
    targetWeightKg: doublePrecision("target_weight_kg"),
    targetDate: text("target_date"),
    calorieTarget: integer("calorie_target").notNull(),
    proteinG: integer("protein_g").notNull(),
    carbsG: integer("carbs_g").notNull(),
    fatG: integer("fat_g").notNull(),
    notesTags: jsonb("notes_tags").$type<string[]>().default([]).notNull(),
    notificationPrefs: jsonb("notification_prefs")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userProfileIdx: index("profiles_user_id_idx").on(table.userId),
  })
);

/**
 * Focus Habits Table
 * The 3 personalized focus habits on Today
 */
export const focusHabits = pgTable(
  "focus_habits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    why: text("why").notNull(),
    metric: text("metric").notNull(),
    target: doublePrecision("target"),
    source: text("source", { enum: ["onboarding", "report", "insight"] })
      .notNull()
      .default("onboarding"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    habitUserIdx: index("focus_habits_user_id_idx").on(table.userId),
  })
);

/**
 * Meals Table
 * Meal events logged by voice, photo, text, or manual
 */
export const meals = pgTable(
  "meals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
    mealType: text("meal_type", {
      enum: ["breakfast", "lunch", "snack", "dinner"],
    }).notNull(),
    source: text("source", {
      enum: ["voice", "camera", "text", "chat", "manual"],
    }).notNull(),
    rawInput: text("raw_input"),
    totalKcal: integer("total_kcal").notNull(),
    proteinG: doublePrecision("protein_g").notNull(),
    carbsG: doublePrecision("carbs_g").notNull(),
    fatG: doublePrecision("fat_g").notNull(),
    confidence: text("confidence", { enum: ["high", "medium", "low"] })
      .notNull()
      .default("high"),
    isSkipped: boolean("is_skipped").notNull().default(false),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    mealUserIdx: index("meals_user_id_idx").on(table.userId),
    mealUserLoggedIdx: index("meals_user_logged_at_idx").on(table.userId, table.loggedAt),
    mealIdempotencyIdx: uniqueIndex("meals_idempotency_key_idx").on(table.idempotencyKey),
  })
);

/**
 * Meal Items Table
 * Discrete ingredients in each meal
 */
export const mealItems = pgTable(
  "meal_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mealId: uuid("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    quantity: doublePrecision("quantity").notNull(),
    unit: text("unit").notNull(),
    kcal: integer("kcal").notNull(),
    proteinG: doublePrecision("protein_g").notNull(),
    carbsG: doublePrecision("carbs_g").notNull(),
    fatG: doublePrecision("fat_g").notNull(),
    confidence: text("confidence", { enum: ["high", "medium", "low"] })
      .notNull()
      .default("high"),
  },
  (table) => ({
    mealItemMealIdx: index("meal_items_meal_id_idx").on(table.mealId),
  })
);

/**
 * Weight Entries Table
 * Historical weigh-ins
 */
export const weightEntries = pgTable(
  "weight_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weightKg: doublePrecision("weight_kg").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    weightUserRecordedIdx: index("weight_entries_user_recorded_idx").on(
      table.userId,
      table.recordedAt
    ),
  })
);

/**
 * Reports Table
 * Uploaded blood test / lab reports
 */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reportDate: text("report_date").notNull(), // YYYY-MM-DD
    label: text("label").notNull(),
    status: text("status", { enum: ["processing", "ready", "error"] })
      .notNull()
      .default("ready"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    reportUserIdx: index("reports_user_id_idx").on(table.userId),
  })
);

/**
 * Report Parameters Table
 * Biomarkers extracted from reports
 */
export const reportParameters = pgTable(
  "report_parameters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    canonicalKey: text("canonical_key"), // e.g. "ldl_cholesterol"
    name: text("name").notNull(),
    value: doublePrecision("value").notNull(),
    unit: text("unit").notNull(),
    refLow: doublePrecision("ref_low"),
    refHigh: doublePrecision("ref_high"),
    status: text("status", { enum: ["low", "normal", "high", "unknown"] })
      .notNull()
      .default("normal"),
  },
  (table) => ({
    reportParamReportIdx: index("report_parameters_report_id_idx").on(table.reportId),
    reportParamCanonicalIdx: index("report_parameters_canonical_key_idx").on(
      table.canonicalKey
    ),
  })
);

/**
 * Insights Table
 * Daily coaching insights
 */
export const insights = pgTable(
  "insights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    text: text("text").notNull(),
    why: text("why").notNull(),
    facts: jsonb("facts").$type<Record<string, unknown>>().default({}).notNull(),
    shownAt: timestamp("shown_at", { withTimezone: true }).defaultNow().notNull(),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
  },
  (table) => ({
    insightUserShownIdx: index("insights_user_shown_idx").on(table.userId, table.shownAt),
  })
);

/**
 * Chat Threads Table
 */
export const chatThreads = pgTable(
  "chat_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Health Assistant Conversation"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    threadUserIdx: index("chat_threads_user_id_idx").on(table.userId),
  })
);

/**
 * Chat Messages Table
 */
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => chatThreads.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    content: text("content").notNull(),
    toolCalls: jsonb("tool_calls").$type<unknown[]>().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    chatMessageThreadIdx: index("chat_messages_thread_id_idx").on(table.threadId),
  })
);

/**
 * Achievements Table
 */
export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(), // e.g. "first_log", "streak_3", "streak_7", "protein_champion"
    earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    achievementUserKeyIdx: uniqueIndex("achievements_user_key_idx").on(
      table.userId,
      table.key
    ),
  })
);

