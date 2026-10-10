import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, radius, typography } from "../../src/theme/tokens";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { OnboardingHeader } from "../../src/features/onboarding/OnboardingHeader";
import { useOnboardingStore } from "../../src/features/onboarding/store";

interface GoalOption {
  type: "fat_loss" | "maintain" | "muscle" | "health";
  title: string;
  subtitle: string;
  emoji: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    type: "fat_loss",
    title: "Lose Fat",
    subtitle: "Sustainable deficit with lean muscle protection",
    emoji: "🔥",
  },
  {
    type: "muscle",
    title: "Build Muscle",
    subtitle: "High protein intake with controlled surplus",
    emoji: "💪",
  },
  {
    type: "maintain",
    title: "Maintain Weight",
    subtitle: "Calorie equilibrium with balanced energy",
    emoji: "⚖️",
  },
  {
    type: "health",
    title: "Eat Healthier",
    subtitle: "Focus on micronutrients, fiber, and meal consistency",
    emoji: "🥗",
  },
];

export default function GoalScreen() {
  const router = useRouter();
  const store = useOnboardingStore();

  const [goalType, setGoalType] = useState<GoalOption["type"]>(store.goalType);
  const [targetWeight, setTargetWeight] = useState(
    store.targetWeightKg ? store.targetWeightKg.toString() : ""
  );
  const [timeframeWeeks, setTimeframeWeeks] = useState(
    store.timeframeWeeks ? store.timeframeWeeks.toString() : "12"
  );

  const needsTargetWeight = goalType === "fat_loss" || goalType === "muscle";

  const handleNext = () => {
    let finalTargetWeightKg: number | undefined = undefined;
    let finalWeeks: number | undefined = undefined;

    if (needsTargetWeight) {
      const parsedWeight = parseFloat(targetWeight);
      if (isNaN(parsedWeight) || parsedWeight < 35 || parsedWeight > 250) {
        Alert.alert("Target Weight", "Please enter a realistic target weight.");
        return;
      }
      finalTargetWeightKg = parsedWeight;

      const parsedWeeks = parseInt(timeframeWeeks, 10);
      if (isNaN(parsedWeeks) || parsedWeeks < 2 || parsedWeeks > 104) {
        Alert.alert("Timeframe", "Please enter a timeframe between 2 and 52 weeks.");
        return;
      }
      finalWeeks = parsedWeeks;
    }

    store.updateData({
      goalType,
      targetWeightKg: finalTargetWeightKg,
      timeframeWeeks: finalWeeks,
    });

    router.push("/onboarding/lifestyle");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OnboardingHeader
        currentStep={3}
        title="Your Primary Goal"
        subtitle="Hale designs calorie deficits and focus habits around your specific intent."
      />

      <View style={styles.goalList}>
        {GOAL_OPTIONS.map((opt) => {
          const isSelected = goalType === opt.type;
          return (
            <Pressable
              key={opt.type}
              style={[styles.goalCard, isSelected && styles.goalCardActive]}
              onPress={() => setGoalType(opt.type)}
            >
              <Text style={styles.goalEmoji}>{opt.emoji}</Text>
              <View style={styles.goalTextCol}>
                <Text
                  style={[
                    styles.goalTitle,
                    isSelected && styles.goalTitleActive,
                  ]}
                >
                  {opt.title}
                </Text>
                <Text style={styles.goalSubtitle}>{opt.subtitle}</Text>
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

      {/* Target weight fields for fat loss and muscle gain */}
      {needsTargetWeight && (
        <Card style={styles.targetSection}>
          <Text style={styles.sectionHeader}>Target & Desired Pace</Text>
          <Text style={styles.sectionSub}>
            Current weight: {store.weightKg} kg
          </Text>

          <View style={styles.inputsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Target Weight (kg)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={targetWeight}
                onChangeText={setTargetWeight}
                placeholder="e.g. 70"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Timeframe (weeks)</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={timeframeWeeks}
                onChangeText={setTimeframeWeeks}
                placeholder="e.g. 12"
              />
            </View>
          </View>

          <Text style={styles.disclaimerNote}>
            💡 If your requested pace exceeds ~1 kg/week, the assistant will kindly propose a safe timeline.
          </Text>
        </Card>
      )}

      <Button
        label="Continue to Lifestyle →"
        onPress={handleNext}
        style={{ marginTop: spacing.md, height: 50 }}
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
  goalList: {
    gap: spacing.sm,
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.md,
  },
  goalCardActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primaryLight,
  },
  goalEmoji: {
    fontSize: 28,
  },
  goalTextCol: {
    flex: 1,
  },
  goalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  goalTitleActive: {
    color: colors.brand.primary,
  },
  goalSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
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
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
  },
  targetSection: {
    gap: spacing.sm,
    backgroundColor: colors.bg.surface,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: "600",
  },
  sectionSub: {
    ...typography.caption,
    color: colors.text.muted,
  },
  inputsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  disclaimerNote: {
    ...typography.caption,
    color: colors.brand.accent,
    backgroundColor: colors.brand.accentLight,
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
});

