import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { Card } from "../../ui/Card";
import type { Insight } from "@hale/shared";

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.tagRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>💡 COACH INSIGHT</Text>
        </View>
      </View>

      <Text style={styles.body}>{insight.text}</Text>

      <View style={styles.whyBox}>
        <Text style={styles.whyLabel}>PHYSIOLOGICAL WHY</Text>
        <Text style={styles.whyText}>{insight.why}</Text>
      </View>

      {insight.actionableTip && (
        <View style={styles.tipRow}>
          <Text style={styles.tipIcon}>✨</Text>
          <Text style={styles.tipText}>{insight.actionableTip}</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brand.accentLight,
    borderColor: "#FAD4C0",
    borderLeftWidth: 4,
    borderLeftColor: colors.brand.accent,
    gap: spacing.xs,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tag: {
    backgroundColor: "rgba(231, 111, 81, 0.12)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tagText: {
    ...typography.badge,
    color: colors.brand.accent,
    fontWeight: "700",
  },
  body: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    lineHeight: 20,
  },
  whyBox: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: 2,
    gap: 2,
  },
  whyLabel: {
    ...typography.badge,
    color: colors.brand.accent,
    fontSize: 10,
    fontWeight: "800",
  },
  whyText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 2,
  },
  tipIcon: {
    fontSize: 14,
  },
  tipText: {
    ...typography.caption,
    color: colors.text.primary,
    fontStyle: "italic",
    flex: 1,
  },
});

