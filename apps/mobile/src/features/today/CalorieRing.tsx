import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { colors, typography } from "../../theme/tokens";
import { clamp, springConfig } from "../../lib/animations";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  const targetProgress = targetKcal > 0 ? clamp(currentKcal / targetKcal, 0, 1) : 0;

  const progressVal = useSharedValue(0);

  useEffect(() => {
    progressVal.value = withSpring(targetProgress, springConfig);
  }, [targetProgress]);

  const animatedProps = useAnimatedProps(() => {
    "worklet";
    return {
      strokeDashoffset: circumference - progressVal.value * circumference,
    };
  });

  const centerScaleStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [
        {
          scale: interpolate(progressVal.value, [0, 1], [0.96, 1]),
        },
      ],
    };
  });

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
        {/* Animated Progress Arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOver ? colors.semantic.warn : colors.brand.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <Animated.View style={[styles.centerTextContainer, centerScaleStyle]}>
        <Text style={styles.kcalNumber}>{currentKcal}</Text>
        <Text style={styles.targetLabel}>/ {targetKcal} kcal</Text>
        <Text style={[styles.remainingLabel, isOver && styles.overLabel]}>
          {isOver ? `+${currentKcal - targetKcal} over` : `${remaining} to go`}
        </Text>
      </Animated.View>
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
