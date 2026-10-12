import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { Card } from "../../ui/Card";
import { lightImpact } from "../../lib/haptics";
import type { FocusHabit } from "@hale/shared";

interface FocusHabitsCardProps {
  habits: FocusHabit[];
  onAskCoach?: (habit: FocusHabit) => void;
}

export function FocusHabitsCard({ habits, onAskCoach }: FocusHabitsCardProps) {
  const router = useRouter();

  if (!habits || habits.length === 0) return null;

  // Strictly display only the top 3 focus habits
  const displayedHabits = habits.slice(0, 3);

  const handleAskCoach = (h: FocusHabit) => {
    lightImpact();
    if (onAskCoach) {
      onAskCoach(h);
      return;
    }

    const prompt =
      h.source === "report"
        ? `Coach, can you explain how I can '${h.title}' based on my lab report findings, and suggest practical food and routine swaps?`
        : `Coach, can you give me practical tips on how to achieve my habit '${h.title}' based on my daily routine and nutrition goals?`;

    router.push({
      pathname: "/(tabs)/chat",
      params: { initialPrompt: prompt },
    });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>TODAY'S 3 FOCUS HABITS</Text>
        <Text style={styles.habitBadge}>Active ({displayedHabits.length})</Text>
      </View>

      <View style={styles.habitsList}>
        {displayedHabits.map((h, i) => (
          <View key={i} style={styles.habitItem}>
            <View style={styles.numBadge}>
              <Text style={styles.numText}>{i + 1}</Text>
            </View>
            <View style={styles.habitContent}>
              <View style={styles.titleRow}>
                <Text style={styles.habitTitle}>{h.title}</Text>
                {h.source === "report" && (
                  <View style={styles.reportTag}>
                    <Text style={styles.reportTagText}>Lab Report</Text>
                  </View>
                )}
              </View>
              <Text style={styles.habitWhy}>{h.why}</Text>
              <View style={styles.bottomRow}>
                {Boolean(h.metric) && (
                  <Text style={styles.habitMetric}>
                    Target: {h.target ? `${h.target} ` : ""}{h.metric}
                  </Text>
                )}
                <Pressable
                  style={styles.askCoachBtn}
                  onPress={() => handleAskCoach(h)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Ask Coach about ${h.title}`}
                >
                  <Text style={styles.askCoachIcon}>💬</Text>
                  <Text style={styles.askCoachText}>Ask Coach</Text>
                </Pressable>
              </View>
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
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  habitTitle: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: "700",
  },
  reportTag: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  reportTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#2563EB",
  },
  habitWhy: {
    ...typography.badge,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  habitMetric: {
    ...typography.badge,
    color: colors.brand.accent,
    fontWeight: "600",
  },
  askCoachBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brand.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 4,
  },
  askCoachIcon: {
    fontSize: 11,
  },
  askCoachText: {
    ...typography.badge,
    color: colors.brand.primary,
    fontWeight: "700",
  },
});
