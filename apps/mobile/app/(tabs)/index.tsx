import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  Alert,
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
  DaySummaryModal,
  MealSlotTracker,
  MealRemindersModal,
} from "../../src/features/today";
import { syncMealReminders } from "../../src/lib/notifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMealCaptureStore } from "../../src/features/food-log/useMealCaptureStore";
import type { TodayResponse } from "@hale/shared";

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { openCapture } = useMealCaptureStore();
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [remindersModalVisible, setRemindersModalVisible] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { data, isLoading, isRefetching, error, refetch } = useQuery<TodayResponse>({
    queryKey: ["today"],
    queryFn: () => api.get<TodayResponse>("/today"),
  });

  useEffect(() => {
    if (data?.timelineMeals) {
      syncMealReminders(data.timelineMeals, data.streak?.currentStreakDays ?? 0);
    }
  }, [data?.timelineMeals, data?.streak?.currentStreakDays]);

  const handleDeleteMeal = async (mealId: string) => {
    await api.delete(`/meals/${mealId}`);
    await queryClient.invalidateQueries({ queryKey: ["today"] });
  };

  const handleResetFlow = () => {
    Alert.alert(
      "Reset to Blank Slate?",
      "This will erase your logged meals, habits, and profile targets so you can start fresh from onboarding.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            setIsResetting(true);
            try {
              await api.post("/dev/reset-account");
            } catch {
              // Even if dev route is disabled on server, reset local device session
              await api.resetSession();
            } finally {
              queryClient.clear();
              setIsResetting(false);
              router.replace("/onboarding/welcome");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.content,
          { paddingTop: Math.max(insets.top, 16) },
        ]}
      >
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
      <View
        style={[
          styles.container,
          styles.centered,
          { paddingTop: Math.max(insets.top, 16) },
        ]}
      >
        <Text style={styles.errorTitle}>Welcome to Hale</Text>
        <Text style={styles.errorSub}>
          Take 90 seconds to build your personalized daily nutrition targets, habits, and coach.
        </Text>
        <Button
          label="Build My Plan (90s) →"
          onPress={() => router.push("/onboarding/welcome")}
          style={{ marginTop: spacing.lg, width: "100%", maxWidth: 280 }}
        />

        {/* 
          // REVIEWER DEMO SEEDING (Disabled for real users)
          <Button
            label={isSeeding ? "Seeding Demo Data..." : "Try With Sample Data"}
            loading={isSeeding}
            disabled={isSeeding}
            variant="outline"
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
            style={{ marginTop: spacing.sm, width: "100%", maxWidth: 280 }}
          />
        */}
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
              } else if (
                data.nextBestAction.actionType === "complete" ||
                data.nextBestAction.id === "day_complete" ||
                data.nextBestAction.ctaText?.toLowerCase().includes("summary")
              ) {
                setSummaryModalVisible(true);
              }
            }}
          />
        )}

        {/* Daily Meal Slot Tracker / Log Meal Indicator */}
        <MealSlotTracker
          meals={data.timelineMeals}
          onPressSlot={(slot) => openCapture(slot)}
          onOpenRemindersModal={() => setRemindersModalVisible(true)}
        />

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

        {/* Reset Flow to Blank Slate */}
        <View style={styles.resetContainer}>
          <Pressable
            style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.7 }]}
            onPress={handleResetFlow}
            disabled={isResetting}
            accessibilityRole="button"
            accessibilityLabel="Reset account to blank slate"
          >
            <Text style={styles.resetButtonText}>
              {isResetting ? "Resetting..." : "↺ Reset Flow to Blank Slate"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Streak & Achievements Modal Sheet */}
      <StreakBadgeModal
        visible={streakModalVisible}
        onClose={() => setStreakModalVisible(false)}
        streak={data.streak}
        mealsCount={data.timelineMeals.length}
      />

      {/* Day Summary Modal Sheet */}
      <DaySummaryModal
        visible={summaryModalVisible}
        onClose={() => setSummaryModalVisible(false)}
        data={data}
      />

      {/* Smart Meal Reminders Modal Sheet */}
      <MealRemindersModal
        visible={remindersModalVisible}
        onClose={() => setRemindersModalVisible(false)}
        meals={data.timelineMeals}
        currentStreakDays={data.streak?.currentStreakDays ?? 0}
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
  resetContainer: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  resetButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.bg.subtle,
  },
  resetButtonText: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: "600",
  },
});
