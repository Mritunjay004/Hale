import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, radius, typography } from "../../theme/tokens";

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps?: number;
  canGoBack?: boolean;
  onBack?: () => void;
  title: string;
  subtitle?: string;
}

export function OnboardingHeader({
  currentStep,
  totalSteps = 5,
  canGoBack = true,
  onBack,
  title,
  subtitle,
}: OnboardingHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {/* Top row: Back button and Step indicator */}
      <View style={styles.topRow}>
        {canGoBack ? (
          <Pressable
            onPress={onBack ? onBack : () => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}

        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${(currentStep / totalSteps) * 100}%` },
          ]}
        />
      </View>

      {/* Title & Subtitle */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.bg.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  backArrow: {
    fontSize: 20,
    color: colors.text.primary,
    fontWeight: "600",
  },
  stepBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.brand.primaryLight,
    borderRadius: radius.full,
  },
  stepBadgeText: {
    ...typography.badge,
    color: colors.brand.primary,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.full,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.brand.primary,
    borderRadius: radius.full,
  },
  textBlock: {
    gap: spacing.xxs,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
});

