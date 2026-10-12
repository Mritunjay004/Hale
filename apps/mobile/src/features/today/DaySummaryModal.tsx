import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { ResponsiveSheet } from "../../ui/ResponsiveSheet";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import type { TodayResponse, MealType } from "@hale/shared";

interface DaySummaryModalProps {
  visible: boolean;
  onClose: () => void;
  data: TodayResponse;
}

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍲",
  snack: "🍎",
};

export function DaySummaryModal({ visible, onClose, data }: DaySummaryModalProps) {
  const calPercent = Math.min(100, Math.round((data.currentKcal / (data.calorieTarget || 1)) * 100));
  const proteinPercent = Math.min(100, Math.round((data.currentProteinG / (data.proteinTargetG || 1)) * 100));
  const carbsPercent = Math.min(100, Math.round((data.currentCarbsG / (data.carbsTargetG || 1)) * 100));
  const fatPercent = Math.min(100, Math.round((data.currentFatG / (data.fatTargetG || 1)) * 100));

  return (
    <ResponsiveSheet visible={visible} onClose={onClose} title="Day Summary">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Celebration Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>ALL SET</Text>
            </View>
            <Text style={styles.heroIcon}>🎉</Text>
          </View>
          <Text style={styles.heroTitle}>Day complete!</Text>
          <Text style={styles.heroSub}>
            Great job logging your meals today. Rest well tonight.
          </Text>
        </View>

        {/* Consistency & Streak Strip */}
        <View style={styles.streakStrip}>
          <View style={styles.streakItem}>
            <Text style={styles.streakValue}>🔥 {data.streak.currentStreakDays} days</Text>
            <Text style={styles.streakLabel}>Habit Streak</Text>
          </View>
          <View style={styles.stripDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakValue}>🍽️ {data.timelineMeals.length} logged</Text>
            <Text style={styles.streakLabel}>Meals Recorded</Text>
          </View>
          <View style={styles.stripDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakValue}>{calPercent}%</Text>
            <Text style={styles.streakLabel}>Calorie Target</Text>
          </View>
        </View>

        {/* Nutritional Breakdown Card */}
        <Card style={styles.macroCard}>
          <View style={styles.macroHeader}>
            <Text style={styles.sectionTitle}>NUTRITIONAL TARGETS</Text>
            <Text style={styles.calorieTotal}>
              {data.currentKcal} / {data.calorieTarget} kcal
            </Text>
          </View>

          {/* Calorie Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${calPercent}%` }]} />
          </View>

          {/* Macro Breakdown Rows */}
          <View style={styles.macroGrid}>
            {/* Protein */}
            <View style={styles.macroCol}>
              <View style={styles.macroColTop}>
                <Text style={styles.macroColName}>Protein</Text>
                <Text style={styles.macroColPercent}>{proteinPercent}%</Text>
              </View>
              <Text style={styles.macroColValue}>{data.currentProteinG}g</Text>
              <Text style={styles.macroColTarget}>of {data.proteinTargetG}g</Text>
              <View style={styles.macroBarBg}>
                <View
                  style={[
                    styles.macroBarFill,
                    { width: `${proteinPercent}%`, backgroundColor: colors.brand.primary },
                  ]}
                />
              </View>
            </View>

            {/* Carbs */}
            <View style={styles.macroCol}>
              <View style={styles.macroColTop}>
                <Text style={styles.macroColName}>Carbs</Text>
                <Text style={styles.macroColPercent}>{carbsPercent}%</Text>
              </View>
              <Text style={styles.macroColValue}>{data.currentCarbsG}g</Text>
              <Text style={styles.macroColTarget}>of {data.carbsTargetG}g</Text>
              <View style={styles.macroBarBg}>
                <View
                  style={[
                    styles.macroBarFill,
                    { width: `${carbsPercent}%`, backgroundColor: "#2A9D8F" },
                  ]}
                />
              </View>
            </View>

            {/* Fat */}
            <View style={styles.macroCol}>
              <View style={styles.macroColTop}>
                <Text style={styles.macroColName}>Fat</Text>
                <Text style={styles.macroColPercent}>{fatPercent}%</Text>
              </View>
              <Text style={styles.macroColValue}>{data.currentFatG}g</Text>
              <Text style={styles.macroColTarget}>of {data.fatTargetG}g</Text>
              <View style={styles.macroBarBg}>
                <View
                  style={[
                    styles.macroBarFill,
                    { width: `${fatPercent}%`, backgroundColor: "#E76F51" },
                  ]}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Logged Meals Recap */}
        {data.timelineMeals.length > 0 && (
          <Card style={styles.mealsCard}>
            <Text style={styles.sectionTitle}>MEALS LOGGED TODAY</Text>
            <View style={styles.mealsList}>
              {data.timelineMeals.map((meal) => {
                const icon = MEAL_ICONS[meal.mealType] ?? "🍽️";
                const typeLabel = meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1);
                const itemsCount = meal.items?.length ?? 0;
                return (
                  <View key={meal.id} style={styles.mealRow}>
                    <Text style={styles.mealIcon}>{icon}</Text>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName}>{typeLabel}</Text>
                      <Text style={styles.mealItemsText}>
                        {itemsCount > 0 ? `${itemsCount} items recorded` : "Logged"}
                      </Text>
                    </View>
                    <View style={styles.mealMacros}>
                      <Text style={styles.mealKcal}>{meal.totalKcal} kcal</Text>
                      <Text style={styles.mealProtein}>{meal.proteinG}g protein</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Recovery & Sleep Advice */}
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>🌙</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Nocturnal Recovery Tip</Text>
            <Text style={styles.tipText}>
              Giving your body 7–8 hours of sound sleep optimizes overnight muscle repair, stabilizes cortisol, and sets you up for morning energy.
            </Text>
          </View>
        </View>

        {/* Done Button */}
        <Button
          label="Done"
          variant="primary"
          onPress={onClose}
          style={{ width: "100%", height: 50, marginTop: spacing.xs }}
        />
      </ScrollView>
    </ResponsiveSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  heroCard: {
    backgroundColor: "#1D3557",
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBadge: {
    backgroundColor: "rgba(82, 183, 136, 0.3)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  heroBadgeText: {
    ...typography.badge,
    color: "#D8F3DC",
    letterSpacing: 0.5,
  },
  heroIcon: {
    fontSize: 20,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.text.inverse,
  },
  heroSub: {
    ...typography.caption,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 18,
  },
  streakStrip: {
    flexDirection: "row",
    backgroundColor: colors.bg.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    justifyContent: "space-around",
    alignItems: "center",
  },
  streakItem: {
    alignItems: "center",
    flex: 1,
  },
  streakValue: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.text.primary,
  },
  streakLabel: {
    ...typography.badge,
    color: colors.text.muted,
    marginTop: 2,
  },
  stripDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.subtle,
  },
  macroCard: {
    gap: spacing.sm,
    backgroundColor: colors.bg.surface,
  },
  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    ...typography.badge,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  calorieTotal: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.brand.primary,
  },
  progressBarBg: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bg.subtle,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.brand.primary,
    borderRadius: radius.full,
  },
  macroGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  macroCol: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: 2,
  },
  macroColTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroColName: {
    ...typography.badge,
    color: colors.text.muted,
  },
  macroColPercent: {
    ...typography.badge,
    fontWeight: "700",
    color: colors.text.primary,
  },
  macroColValue: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: 2,
  },
  macroColTarget: {
    ...typography.badge,
    color: colors.text.muted,
  },
  macroBarBg: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border.subtle,
    marginTop: spacing.xs,
    overflow: "hidden",
  },
  macroBarFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  mealsCard: {
    gap: spacing.sm,
    backgroundColor: colors.bg.surface,
  },
  mealsList: {
    gap: spacing.xs,
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  mealIcon: {
    fontSize: 22,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.text.primary,
  },
  mealItemsText: {
    ...typography.badge,
    color: colors.text.muted,
  },
  mealMacros: {
    alignItems: "flex-end",
  },
  mealKcal: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.text.primary,
  },
  mealProtein: {
    ...typography.badge,
    color: colors.brand.primary,
  },
  tipCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.brand.primaryLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: "flex-start",
  },
  tipIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
    gap: 2,
  },
  tipTitle: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.brand.primary,
  },
  tipText: {
    ...typography.badge,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});

