import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { Card } from "../../ui/Card";
import { springConfig } from "../../lib/animations";
import type { ParameterTrendResponse } from "@hale/shared";

interface BiomarkerTrendCardProps {
  trend: ParameterTrendResponse;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  normal: { label: "IN RANGE", color: "#2E7D32", bg: "#E8F5E9" },
  low: { label: "BELOW RANGE", color: "#E65100", bg: "#FFF3E0" },
  high: { label: "ELEVATED", color: "#C62828", bg: "#FFEBEE" },
  unknown: { label: "UNKNOWN", color: "#616161", bg: "#F5F5F5" },
};

export function BiomarkerTrendCard({ trend }: BiomarkerTrendCardProps) {
  const latestPoint = trend.history[trend.history.length - 1];
  const latestValue = latestPoint ? latestPoint.value : null;
  const statusCfg = STATUS_CONFIG[latestPoint?.status ?? "normal"] ?? STATUS_CONFIG.normal!;

  // Range bar positioning
  const minScale = Math.min(trend.refLow * 0.7, (latestValue ?? trend.refLow) * 0.85);
  const maxScale = Math.max(trend.refHigh * 1.3, (latestValue ?? trend.refHigh) * 1.15);
  const totalSpan = maxScale - minScale;

  const leftRefPercent = Math.max(0, Math.min(100, ((trend.refLow - minScale) / totalSpan) * 100));
  const widthRefPercent = Math.max(10, Math.min(100, ((trend.refHigh - trend.refLow) / totalSpan) * 100));

  const markerPercent =
    latestValue != null
      ? Math.max(2, Math.min(98, ((latestValue - minScale) / totalSpan) * 100))
      : 50;

  const animatedMarker = useSharedValue(0);

  React.useEffect(() => {
    animatedMarker.value = withSpring(markerPercent, springConfig);
  }, [markerPercent]);

  const animatedMarkerStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      left: `${animatedMarker.value}%`,
    };
  });

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.biomarkerName}>{trend.name}</Text>
          <Text style={styles.refRangeLabel}>
            Target Range: {trend.refLow} – {trend.refHigh} {trend.standardUnit}
          </Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusText, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
        </View>
      </View>

      {/* Latest Value Hero */}
      {latestValue != null && (
        <View style={styles.valueRow}>
          <Text style={styles.valueNumber}>{latestValue}</Text>
          <Text style={styles.valueUnit}>{trend.standardUnit}</Text>
          <Text style={styles.dateRecorded}>as of {latestPoint?.date}</Text>
        </View>
      )}

      {/* Visual Reference Range Bar */}
      <View style={styles.rangeBarContainer}>
        {/* Track */}
        <View style={styles.rangeTrack}>
          {/* Normal range highlight zone */}
          <View
            style={[
              styles.normalZone,
              {
                left: `${leftRefPercent}%`,
                width: `${widthRefPercent}%`,
              },
            ]}
          />

          {/* Current value marker pin */}
          {latestValue != null && (
            <Animated.View style={[styles.markerPin, animatedMarkerStyle]}>
              <View style={[styles.markerHead, { backgroundColor: statusCfg.color }]} />
            </Animated.View>
          )}
        </View>

        {/* Range Labels */}
        <View style={styles.rangeLabelsRow}>
          <Text style={styles.rangeBound}>{trend.refLow} (Low)</Text>
          <Text style={styles.rangeCenterLabel}>Normal Zone</Text>
          <Text style={styles.rangeBound}>{trend.refHigh} (High)</Text>
        </View>
      </View>

      {/* Physiological WHY & Clinical Explanation */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationHeader}>💡 WHY THIS MATTERS FOR YOUR VITALITY</Text>
        <Text style={styles.explanationText}>{trend.explanation}</Text>
      </View>

      {/* Historical Trend Log */}
      {trend.history.length > 1 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>HISTORICAL TESTS</Text>
          {trend.history.map((h, i) => (
            <View key={i} style={styles.historyRow}>
              <Text style={styles.historyDate}>{h.date}</Text>
              <Text style={styles.historyVal}>
                {h.value} {h.unit}
              </Text>
              <Text style={styles.historyStatus}>
                {h.status.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  biomarkerName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  refRangeLabel: {
    ...typography.badge,
    color: colors.text.muted,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.badge,
    fontWeight: "800",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  valueNumber: {
    ...typography.h1,
    color: colors.brand.primary,
    fontWeight: "800",
  },
  valueUnit: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  dateRecorded: {
    ...typography.badge,
    color: colors.text.muted,
    marginLeft: spacing.xs,
  },
  rangeBarContainer: {
    marginTop: spacing.xs,
    gap: 6,
  },
  rangeTrack: {
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: radius.full,
    position: "relative",
    justifyContent: "center",
  },
  normalZone: {
    position: "absolute",
    height: "100%",
    backgroundColor: "#A7F3D0",
    borderRadius: radius.full,
  },
  markerPin: {
    position: "absolute",
    alignItems: "center",
    marginLeft: -7,
  },
  markerHead: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  rangeLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rangeBound: {
    ...typography.badge,
    color: colors.text.muted,
    fontSize: 10,
  },
  rangeCenterLabel: {
    ...typography.badge,
    color: colors.semantic.success,
    fontSize: 10,
    fontWeight: "700",
  },
  explanationBox: {
    backgroundColor: colors.bg.canvas,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: 4,
    marginTop: spacing.xxs,
  },
  explanationHeader: {
    ...typography.badge,
    color: colors.brand.accent,
    fontWeight: "800",
    fontSize: 10,
  },
  explanationText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  historySection: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.xs,
    gap: 4,
    marginTop: spacing.xs,
  },
  historyTitle: {
    ...typography.badge,
    color: colors.text.muted,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyDate: {
    ...typography.caption,
    color: colors.text.muted,
  },
  historyVal: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: "600",
  },
  historyStatus: {
    ...typography.badge,
    color: colors.text.secondary,
  },
});

