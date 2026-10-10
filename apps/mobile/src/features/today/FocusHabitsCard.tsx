import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { Card } from "../../ui/Card";
import type { FocusHabit } from "@hale/shared";

interface FocusHabitsCardProps {
  habits: FocusHabit[];
}

export function FocusHabitsCard({ habits }: FocusHabitsCardProps) {
  if (!habits || habits.length === 0) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>TODAY'S 3 FOCUS HABITS</Text>
        <Text style={styles.habitBadge}>Active</Text>
      </View>

      <View style={styles.habitsList}>
        {habits.map((h, i) => (
          <View key={i} style={styles.habitItem}>
            <View style={styles.numBadge}>
              <Text style={styles.numText}>{i + 1}</Text>
            </View>
            <View style={styles.habitContent}>
              <Text style={styles.habitTitle}>{h.title}</Text>
              <Text style={styles.habitWhy}>{h.why}</Text>
              <Text style={styles.habitMetric}>Target: {h.target} {h.metric}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    backgroundColor: colors.bg.surface,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    ...typography.badge,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  habitBadge: {
    ...typography.badge,
    color: colors.brand.primary,
    fontWeight: "700",
  },
  habitsList: {
    gap: spacing.sm,
  },
  habitItem: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  numBadge: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  numText: {
    ...typography.badge,
    color: colors.brand.primary,
    fontWeight: "700",
  },
  habitContent: {
    flex: 1,
    gap: 2,
  },
  habitTitle: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: "700",
  },
  habitWhy: {
    ...typography.badge,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  habitMetric: {
    ...typography.badge,
    color: colors.brand.accent,
    fontWeight: "600",
    marginTop: 2,
  },
});

