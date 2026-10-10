import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, radius, typography } from "../../src/theme/tokens";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { OnboardingHeader } from "../../src/features/onboarding/OnboardingHeader";
import { useOnboardingStore } from "../../src/features/onboarding/store";
import { api } from "../../src/lib/api-client";
import type { PlanResponse } from "@hale/shared";

const ACTIVITY_LEVELS = [
  {
    level: "sedentary" as const,
    title: "Sedentary",
    desc: "Desk job, little intentional exercise",
  },
  {
    level: "light" as const,
    title: "Lightly Active",
    desc: "1-3 light workout sessions / brisk walks a week",
  },
  {
    level: "moderate" as const,
    title: "Moderately Active",
    desc: "3-5 moderate workouts / gym / running sessions",
  },
  {
    level: "heavy" as const,
    title: "Very Active",
    desc: "Daily intense training, physical labor, or competitive sport",
  },
];

const DIET_PREFERENCES = [
  { pref: "none" as const, label: "Anything" },
  { pref: "veg" as const, label: "Vegetarian" },
  { pref: "non_veg" as const, label: "Non-Veg" },
  { pref: "eggetarian" as const, label: "Eggetarian" },
  { pref: "vegan" as const, label: "Vegan" },
];

const COMMON_TAGS = [
  "Lactose Sensitive",
  "Gluten Free",
  "High Blood Pressure",
  "Borderline Cholesterol",
  "Desk Bound",
  "Early Dinner Preferred",
];

export default function LifestyleScreen() {
  const router = useRouter();
  const store = useOnboardingStore();

  const [activity, setActivity] = useState(store.activityLevel);
  const [diet, setDiet] = useState(store.dietPreference);
  const [tags, setTags] = useState<string[]>(store.notesTags);
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCalculatePlan = async () => {
    setLoading(true);
    store.updateData({
      activityLevel: activity,
      dietPreference: diet,
      notesTags: tags,
    });

    try {
      // Calculate target plan on server
      const plan = await api.post<PlanResponse>("/profile/plan", {
        age: store.age,
        sex: store.sex,
        heightCm: store.heightCm,
        weightKg: store.weightKg,
        activityLevel: activity,
        dietPreference: diet,
        goalType: store.goalType,
        targetWeightKg: store.targetWeightKg,
        timeframeWeeks: store.timeframeWeeks,
        notesTags: tags,
      });

      store.setCalculatedPlan(plan);
      router.push("/onboarding/plan");
    } catch (err) {
      console.error(err);
      // Fallback transition
      router.push("/onboarding/plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OnboardingHeader
        currentStep={4}
        title="Lifestyle & Habits"
        subtitle="Calibrates your daily energy expenditure (TDEE) and meal suggestions."
      />

      {/* Activity Multiplier */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Daily Activity Level</Text>
        <View style={styles.activityList}>
          {ACTIVITY_LEVELS.map((item) => {
            const isSelected = activity === item.level;
            return (
              <Pressable
                key={item.level}
                style={[
                  styles.activityOption,
                  isSelected && styles.activityOptionActive,
                ]}
                onPress={() => setActivity(item.level)}
              >
                <View style={styles.activityTextCol}>
                  <Text
                    style={[
                      styles.activityTitle,
                      isSelected && styles.activityTitleActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.activityDesc}>{item.desc}</Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleActive,
                  ]}
                >
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Diet Preference */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Dietary Preference</Text>
        <View style={styles.dietChipsRow}>
          {DIET_PREFERENCES.map((d) => {
            const isSelected = diet === d.pref;
            return (
              <Pressable
                key={d.pref}
                style={[styles.dietChip, isSelected && styles.dietChipActive]}
                onPress={() => setDiet(d.pref)}
              >
                <Text
                  style={[styles.chipText, isSelected && styles.chipTextActive]}
                >
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Optional Context Chips */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Anything We Should Know?</Text>
        <Text style={styles.sectionNote}>Optional preferences or sensitivities</Text>
        <View style={styles.dietChipsRow}>
          {COMMON_TAGS.map((tag) => {
            const isSelected = tags.includes(tag);
            return (
              <Pressable
                key={tag}
                style={[styles.tagChip, isSelected && styles.tagChipActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[styles.chipText, isSelected && styles.chipTextActive]}
                >
                  {isSelected ? "✓ " : "+ "}
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Button
        label={loading ? "Generating Your Plan..." : "Calculate My Plan →"}
        onPress={handleCalculatePlan}
        disabled={loading}
        loading={loading}
        style={{ marginTop: spacing.md, height: 52 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing["4xl"],
    gap: spacing.md,
  },
  sectionCard: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  sectionNote: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: -4,
  },
  activityList: {
    gap: spacing.xs,
  },
  activityOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activityOptionActive: {
    backgroundColor: colors.brand.primaryLight,
    borderColor: colors.brand.primary,
  },
  activityTextCol: {
    flex: 1,
  },
  activityTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: "600",
  },
  activityTitleActive: {
    color: colors.brand.primary,
  },
  activityDesc: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    borderColor: colors.brand.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
  },
  dietChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  dietChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  dietChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  tagChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  tagChipActive: {
    backgroundColor: colors.brand.primaryLight,
    borderColor: colors.brand.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  chipTextActive: {
    color: colors.text.inverse,
    fontWeight: "600",
  },
});

