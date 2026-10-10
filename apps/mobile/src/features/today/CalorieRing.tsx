import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, typography, spacing } from "../../theme/tokens";

interface CalorieRingProps {
  currentKcal: number;
  targetKcal: number;
  size?: number;
  strokeWidth?: number;
}

export function CalorieRing({
  currentKcal,
  targetKcal,
  size = 140,
  strokeWidth = 12,
}: CalorieRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = targetKcal > 0 ? Math.min(1, Math.max(0, currentKcal / targetKcal)) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const remaining = Math.max(0, targetKcal - currentKcal);
  const isOver = currentKcal > targetKcal;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.brand.primaryLight}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOver ? colors.semantic.warn : colors.brand.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.centerTextContainer}>
        <Text style={styles.kcalNumber}>{currentKcal}</Text>
        <Text style={styles.targetLabel}>/ {targetKcal} kcal</Text>
        <Text style={[styles.remainingLabel, isOver && styles.overLabel]}>
          {isOver ? `+${currentKcal - targetKcal} over` : `${remaining} to go`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  centerTextContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  kcalNumber: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: "800",
  },
  targetLabel: {
    ...typography.badge,
    color: colors.text.muted,
    marginTop: -2,
  },
  remainingLabel: {
    ...typography.caption,
    color: colors.brand.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  overLabel: {
    color: colors.semantic.warn,
  },
});
