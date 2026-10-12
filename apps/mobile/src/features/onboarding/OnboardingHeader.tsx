import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { lightImpact } from "../../lib/haptics";

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
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    lightImpact();
    if (onBack) onBack();
    else router.back();
  };

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top row: Back button and Step indicator */}
      <View style={styles.topRow}>
        {canGoBack ? (
          <Pressable
            onPress={handleBackPress}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke={colors.text.primary}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
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
  backButtonPressed: {
    backgroundColor: colors.bg.subtle,
    transform: [{ scale: 0.95 }],
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
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

