import React, { useState } from "react";
import {
  View,
  Text,
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

function formatFriendlyDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function PlanPayoffScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [saving, setSaving] = useState(false);
  const [pushbackAccepted, setPushbackAccepted] = useState(false);

  const plan = store.calculatedPlan;

  const handleAcceptPushback = () => {
    setPushbackAccepted(true);
    if (pushback?.proposedWeeks) {
      store.updateData({
        targetWeeks: pushback.proposedWeeks,
        acceptedPushbackDate: pushback.proposedTargetDate ?? null,
      });
    }
  };

  // Fallback defaults if accessed directly
  const calorieTarget = plan?.calorieTarget ?? 1950;
  const proteinG = plan?.proteinG ?? 95;
  const carbsG = plan?.carbsG ?? 220;
  const fatG = plan?.fatG ?? 60;
  const whyCalorie =
    plan?.whyText ??
    "Your body burns ~2,350 kcal/day. A 400 kcal deficit lets you drop ~0.4 kg/week sustainably without metabolic slowdown.";
  const pushback = plan?.pushback;
  const habits = plan?.focusHabits ?? [
    {
      type: "protein_target",
      title: `Hit ${proteinG}g daily protein`,
      why: "In a calorie deficit, protein protects lean muscle tissue so weight lost is pure body fat.",
      metric: "Grams logged across meals",
    },
    {
      type: "log_frequency",
      title: "Log at least 2 meals every day",
      why: "People who log consistently lose twice as much weight. Hale makes it take under 10 seconds.",
      metric: "Daily habit streak",
    },
    {
      type: "light_dinner",
      title: "Keep dinner lighter than lunch",
      why: "Concentrating calories earlier improves glycemic response and sleep recovery.",
      metric: "Dinner calorie balance",
    },
  ];

  const handleConfirmPlan = async () => {
    setSaving(true);
    try {
      await api.put("/profile", {
        age: store.age,
        sex: store.sex,
        heightCm: store.heightCm,
        weightKg: store.weightKg,
        activityLevel: store.activityLevel,
        dietPreference: store.dietPreference,
        goalType: store.goalType,
        targetWeightKg: store.targetWeightKg,
        targetWeeks: store.targetWeeks,
        notesTags: store.notesTags,
      });

      router.replace("/(tabs)");
    } catch (err) {
      console.error(err);
      router.replace("/(tabs)");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OnboardingHeader
        currentStep={5}
        title="Your Personalized Plan"
        subtitle="Designed for metabolic health and effortless consistency."
      />

      {/* Respectful Pushback Banner (if requested timeline was too aggressive) */}
      {pushback && (
        <Card style={[styles.pushbackCard, pushbackAccepted && styles.pushbackCardAccepted]}>
          <View style={styles.pushbackHeaderRow}>
            <View style={[styles.pushbackTag, pushbackAccepted && styles.pushbackTagAccepted]}>
              <Text style={[styles.pushbackTagText, pushbackAccepted && styles.pushbackTagTextAccepted]}>
                {pushbackAccepted ? "PACE ADJUSTED" : "ASSISTANT RECOMMENDATION"}
              </Text>
            </View>
            {pushbackAccepted && (
              <Text style={styles.acceptedCheck}>✓ {pushback.proposedWeeks} weeks applied</Text>
            )}
          </View>

          <Text style={styles.pushbackTitle}>
            {pushbackAccepted ? "Safe Pace Applied" : "Pacing Adjustment"}
          </Text>

          <Text style={styles.pushbackBody}>
            {pushbackAccepted
              ? `Timeline adjusted to ${pushback.proposedWeeks} weeks${pushback.proposedTargetDate ? ` (~${formatFriendlyDate(pushback.proposedTargetDate)})` : ""} to ensure sustainable fat loss of ~${pushback.safeRateKgPerWeek} kg/week without muscle loss.`
              : `${pushback.reason} To protect your lean muscle and keep your metabolism steady, we recommend aiming for ${pushback.proposedWeeks} weeks${pushback.proposedTargetDate ? ` (~${formatFriendlyDate(pushback.proposedTargetDate)})` : ""} at a safe pace of ~${pushback.safeRateKgPerWeek} kg/week.`}
          </Text>

          {!pushbackAccepted && (
            <View style={styles.pushbackActions}>
              <Button
                label={
                  pushback.proposedWeeks
                    ? `Accept (Aim for ${pushback.proposedWeeks} weeks)`
                    : "Accept Safe Timeline"
                }
                onPress={handleAcceptPushback}
                style={{ flex: 1 }}
              />
            </View>
          )}
        </Card>
      )}

      {/* Main Calorie & Macro Target Card */}
      <Card style={styles.heroTargetCard}>
        <Text style={styles.targetLabel}>DAILY CALORIE TARGET</Text>
        <View style={styles.targetNumberRow}>
          <Text style={styles.targetNumber}>{calorieTarget}</Text>
          <Text style={styles.targetUnit}>kcal / day</Text>
        </View>

        <View style={styles.whyBox}>
          <Text style={styles.whyText}>💡 {whyCalorie}</Text>
        </View>

        {/* Macro Breakdown */}
        <View style={styles.macroRow}>
          <View style={styles.macroPill}>
            <Text style={styles.macroVal}>{proteinG}g</Text>
            <Text style={styles.macroName}>Protein</Text>
          </View>
          <View style={styles.macroPill}>
            <Text style={styles.macroVal}>{carbsG}g</Text>
            <Text style={styles.macroName}>Carbs</Text>
          </View>
          <View style={styles.macroPill}>
            <Text style={styles.macroVal}>{fatG}g</Text>
            <Text style={styles.macroName}>Fats</Text>
          </View>
        </View>
      </Card>

      {/* 3 Focus Habits (WHAT, WHY, HOW MEASURED) */}
      <View style={styles.habitsSection}>
        <Text style={styles.sectionHeading}>3 Focus Habits for Success</Text>
        <Text style={styles.sectionSubtitle}>
          Habits aligned directly to your target goals
        </Text>

        {habits.map((h, i) => (
          <Card key={i} style={styles.habitCard}>
            <View style={styles.habitHeader}>
              <View style={styles.habitBadge}>
                <Text style={styles.habitBadgeText}>HABIT {i + 1}</Text>
              </View>
              <Text style={styles.habitMetric}>📊 {h.metric}</Text>
            </View>

            <Text style={styles.habitTitle}>{h.title}</Text>
            <Text style={styles.habitWhy}>{h.why}</Text>
          </Card>
        ))}
      </View>

      <Button
        label={saving ? "Saving Profile..." : "Log My First Meal →"}
        onPress={handleConfirmPlan}
        loading={saving}
        disabled={saving}
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
  pushbackCard: {
    backgroundColor: colors.brand.accentLight,
    borderColor: "#FAD4C0",
    borderLeftWidth: 4,
    borderLeftColor: colors.brand.accent,
    gap: spacing.xs,
  },
  pushbackCardAccepted: {
    backgroundColor: colors.brand.primaryLight,
    borderColor: "#C5D8C9",
    borderLeftColor: colors.semantic.success,
  },
  pushbackHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pushbackTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(224, 122, 95, 0.2)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pushbackTagAccepted: {
    backgroundColor: "rgba(45, 106, 79, 0.15)",
  },
  pushbackTagText: {
    ...typography.badge,
    color: colors.brand.accent,
  },
  pushbackTagTextAccepted: {
    color: colors.semantic.success,
  },
  acceptedCheck: {
    ...typography.caption,
    color: colors.semantic.success,
    fontWeight: "600",
  },
  pushbackTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  pushbackBody: {
    ...typography.body,
    color: colors.text.secondary,
  },
  pushbackActions: {
    flexDirection: "row",
    marginTop: spacing.xs,
  },
  heroTargetCard: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
    gap: spacing.sm,
  },
  targetLabel: {
    ...typography.badge,
    color: "rgba(255, 255, 255, 0.8)",
  },
  targetNumberRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  targetNumber: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "700",
    color: colors.text.inverse,
    includeFontPadding: false,
  },
  targetUnit: {
    ...typography.h3,
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: 4,
  },
  whyBox: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xxs,
  },
  whyText: {
    ...typography.caption,
    color: colors.text.inverse,
    lineHeight: 18,
  },
  macroRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  macroPill: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    alignItems: "center",
  },
  macroVal: {
    ...typography.h3,
    color: colors.text.inverse,
  },
  macroName: {
    ...typography.caption,
    color: "rgba(255, 255, 255, 0.8)",
  },
  habitsSection: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionHeading: {
    ...typography.h2,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: -4,
  },
  habitCard: {
    gap: spacing.xs,
    backgroundColor: colors.bg.surface,
  },
  habitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  habitBadge: {
    backgroundColor: colors.brand.primaryLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  habitBadgeText: {
    ...typography.badge,
    color: colors.brand.primary,
  },
  habitMetric: {
    ...typography.caption,
    color: colors.text.muted,
  },
  habitTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  habitWhy: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
