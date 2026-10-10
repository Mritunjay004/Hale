import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../src/lib/api-client.js";
import { colors, spacing, radius, typography } from "../../src/theme/tokens.js";
import { Card } from "../../src/ui/Card.js";
import { Button } from "../../src/ui/Button.js";
import { Skeleton } from "../../src/ui/Skeleton.js";
import type { TodayResponse } from "@hale/shared";

export default function TodayScreen() {
  const { data, isLoading, error, refetch } = useQuery<TodayResponse>({
    queryKey: ["today"],
    queryFn: () => api.get<TodayResponse>("/today"),
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Skeleton width={160} height={28} />
          <Skeleton width={80} height={24} borderRadius={radius.full} />
        </View>
        <Skeleton width="100%" height={120} borderRadius={radius.lg} style={{ marginTop: spacing.md }} />
        <Skeleton width="100%" height={160} borderRadius={radius.lg} style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorTitle}>Welcome to Hale</Text>
        <Text style={styles.errorSub}>
          Complete your 90-second onboarding to receive your personalized health plan.
        </Text>
        <Button
          label="Try With Demo Data"
          onPress={async () => {
            try {
              await api.post("/dev/seed-demo");
              void refetch();
            } catch (err) {
              console.error(err);
            }
          }}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateLabel}>{data.date}</Text>
          <Text style={styles.greeting}>Good day, {data.userFirstName}</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>{data.streak.currentStreakDays} days</Text>
        </View>
      </View>

      {/* Next Best Action Card */}
      <Card style={styles.nextActionCard}>
        <View style={styles.nbaTag}>
          <Text style={styles.nbaTagText}>NEXT BEST ACTION</Text>
        </View>
        <Text style={styles.nbaTitle}>{data.nextBestAction.title}</Text>
        <Text style={styles.nbaSub}>{data.nextBestAction.subtitle}</Text>
        <Button
          label={data.nextBestAction.ctaText}
          variant="secondary"
          onPress={() => {}}
          style={styles.nbaButton}
        />
      </Card>

      {/* Daily Target Balance Card */}
      <Card style={styles.balanceCard}>
        <Text style={styles.cardHeader}>Daily Target Balance</Text>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.calorieNumber}>
              {data.currentKcal}{" "}
              <Text style={styles.calorieUnit}>/ {data.calorieTarget} kcal</Text>
            </Text>
            <Text style={styles.remainingText}>
              {data.remainingKcal} kcal remaining
            </Text>
          </View>
          <View style={styles.macroPill}>
            <Text style={styles.macroText}>
              Protein: {data.currentProteinG}g / {data.proteinTargetG}g
            </Text>
          </View>
        </View>
      </Card>

      {/* Coach Insight */}
      {data.insight && (
        <Card style={styles.insightCard}>
          <Text style={styles.insightTag}>COACH INSIGHT</Text>
          <Text style={styles.insightBody}>{data.insight.text}</Text>
          <Text style={styles.insightWhy}>💡 {data.insight.why}</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing["4xl"],
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  dateLabel: {
    ...typography.badge,
    color: colors.text.muted,
    textTransform: "uppercase",
  },
  greeting: {
    ...typography.h2,
    color: colors.text.primary,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brand.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    gap: spacing.xxs,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    ...typography.badge,
    color: colors.brand.accent,
  },
  nextActionCard: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  nbaTag: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
    marginBottom: spacing.xs,
  },
  nbaTagText: {
    ...typography.badge,
    color: colors.text.inverse,
  },
  nbaTitle: {
    ...typography.h3,
    color: colors.text.inverse,
  },
  nbaSub: {
    ...typography.caption,
    color: "rgba(255, 255, 255, 0.85)",
    marginVertical: spacing.xs,
  },
  nbaButton: {
    backgroundColor: colors.bg.surface,
    marginTop: spacing.xs,
  },
  balanceCard: {
    gap: spacing.sm,
  },
  cardHeader: {
    ...typography.h3,
    color: colors.text.primary,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calorieNumber: {
    ...typography.h1,
    color: colors.brand.primary,
  },
  calorieUnit: {
    ...typography.body,
    color: colors.text.muted,
  },
  remainingText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  macroPill: {
    backgroundColor: colors.brand.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  macroText: {
    ...typography.caption,
    color: colors.brand.primary,
    fontWeight: "600",
  },
  insightCard: {
    backgroundColor: colors.brand.accentLight,
    borderColor: "#FAD4C0",
    borderLeftWidth: 4,
    borderLeftColor: colors.brand.accent,
    gap: spacing.xs,
  },
  insightTag: {
    ...typography.badge,
    color: colors.brand.accent,
  },
  insightBody: {
    ...typography.body,
    color: colors.text.primary,
  },
  insightWhy: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  errorTitle: {
    ...typography.h1,
    color: colors.brand.primary,
    marginBottom: spacing.xs,
  },
  errorSub: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 320,
  },
});

