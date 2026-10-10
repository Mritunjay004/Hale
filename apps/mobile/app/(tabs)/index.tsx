import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../src/lib/api-client";
import { colors, spacing, radius, typography } from "../../src/theme/tokens";
import { Card } from "../../src/ui/Card";
import { Button } from "../../src/ui/Button";
import { Skeleton } from "../../src/ui/Skeleton";
import {
  CalorieRing,
  MacroBars,
  NextBestActionCard,
  InsightCard,
  MealTimeline,
  StreakBadgeModal,
  FocusHabitsCard,
} from "../../src/features/today";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMealCaptureStore } from "../../src/features/food-log/useMealCaptureStore";
import type { TodayResponse } from "@hale/shared";

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { openCapture } = useMealCaptureStore();
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const { data, isLoading, isRefetching, error, refetch } = useQuery<TodayResponse>({
    queryKey: ["today"],
    queryFn: () => api.get<TodayResponse>("/today"),
  });

  const handleDeleteMeal = async (mealId: string) => {
    await api.delete(`/meals/${mealId}`);
    await queryClient.invalidateQueries({ queryKey: ["today"] });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Skeleton width={180} height={32} />
          <Skeleton width={88} height={28} borderRadius={radius.full} />
        </View>
        <Skeleton width="100%" height={120} borderRadius={radius.lg} style={{ marginTop: spacing.md }} />
        <Skeleton width="100%" height={180} borderRadius={radius.lg} style={{ marginTop: spacing.md }} />
        <Skeleton width="100%" height={140} borderRadius={radius.lg} style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorTitle}>Welcome to Hale</Text>
        <Text style={styles.errorSub}>
          Complete your 90-second onboarding to receive your personalized health plan, or test with sample reviewer data.
        </Text>
        <Button
          label={isSeeding ? "Seeding Demo Data..." : "Try With Sample Data"}
          loading={isSeeding}
          disabled={isSeeding}
          onPress={async () => {
            setIsSeeding(true);
            try {
              await api.post("/dev/seed-demo");
              await refetch();
            } catch (err) {
              console.error("Failed to seed demo data:", err);
            } finally {
              setIsSeeding(false);
            }
          }}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 16) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.brand.primary}
          />
        }
      >
        {/* Header with Greeting & Interactive Streak Pill */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateLabel}>{data.date}</Text>
            <Text style={styles.greeting}>
              {timeGreeting}, {data.userFirstName}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.streakBadge, pressed && { opacity: 0.8 }]}
            onPress={() => setStreakModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`Streak: ${data.streak.currentStreakDays} days. Tap to view achievements.`}
          >
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text style={styles.streakText}>{data.streak.currentStreakDays} days</Text>
              {!data.streak.hasGraceDayUsedThisWeek && (
                <Text style={styles.streakGraceMini}>Grace Active</Text>
              )}
            </View>
          </Pressable>
        </View>

        {/* Next Best Action Card */}
        {data.nextBestAction && (
          <NextBestActionCard
            action={data.nextBestAction}
            onPressAction={() => {
              if (data.nextBestAction.actionType === "log_meal") {
                openCapture(data.nextBestAction.suggestedMealType);
              }
            }}
          />
        )}

        {/* Daily Target Balance Card (Ring + Macro Bars) */}
        <Card style={styles.targetsCard}>
          <View style={styles.targetsHeader}>
            <Text style={styles.sectionTitle}>DAILY TARGET BALANCE</Text>
            <Text style={styles.caloriePill}>
              {data.currentKcal} / {data.calorieTarget} kcal
            </Text>
          </View>

          <View style={styles.targetsBody}>
            <View style={styles.ringWrapper}>
              <CalorieRing
                currentKcal={data.currentKcal}
                targetKcal={data.calorieTarget}
                size={130}
                strokeWidth={11}
              />
            </View>

            <View style={styles.macrosWrapper}>
              <MacroBars
                currentProteinG={data.currentProteinG}
                targetProteinG={data.proteinTargetG}
                currentCarbsG={data.currentCarbsG}
                targetCarbsG={data.carbsTargetG}
                currentFatG={data.currentFatG}
                targetFatG={data.fatTargetG}
              />
            </View>
          </View>
        </Card>

        {/* Proactive Coach Insight Card */}
        {data.insight && <InsightCard insight={data.insight} />}

        {/* 3 Focus Habits Card */}
        {data.activeHabits && data.activeHabits.length > 0 && (
          <FocusHabitsCard habits={data.activeHabits} />
        )}

        {/* Today's Logged Meals Timeline */}
        <MealTimeline
          meals={data.timelineMeals}
          onDeleteMeal={handleDeleteMeal}
          onPressLogMeal={() => openCapture()}
        />
      </ScrollView>

      {/* Streak & Achievements Modal Sheet */}
      <StreakBadgeModal
        visible={streakModalVisible}
        onClose={() => setStreakModalVisible(false)}
        streak={data.streak}
        mealsCount={data.timelineMeals.length}
      />
    </>
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
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "#FAD4C0",
  },
  streakEmoji: {
    fontSize: 16,
  },
  streakText: {
    ...typography.badge,
    color: colors.brand.accent,
    fontWeight: "700",
  },
  streakGraceMini: {
    fontSize: 9,
    color: colors.brand.primary,
    fontWeight: "600",
  },
  targetsCard: {
    gap: spacing.sm,
    backgroundColor: colors.bg.surface,
  },
  targetsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    ...typography.badge,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  caloriePill: {
    ...typography.badge,
    color: colors.brand.primary,
    fontWeight: "700",
  },
  targetsBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  ringWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  macrosWrapper: {
    flex: 1,
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
