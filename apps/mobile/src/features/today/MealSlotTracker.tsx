import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { Card } from "../../ui/Card";
import { IconBell, IconCheck, IconPlus } from "../../ui/icons";
import { lightImpact } from "../../lib/haptics";
import type { MealRecord } from "@hale/shared";

interface MealSlotTrackerProps {
  meals: MealRecord[];
  onPressSlot: (slot: "breakfast" | "lunch" | "dinner" | "snack") => void;
  onOpenRemindersModal: () => void;
}

interface SlotConfig {
  key: "breakfast" | "lunch" | "dinner" | "snack";
  label: string;
  emoji: string;
  isMain: boolean;
  expectedWindow: string;
}

const SLOTS: SlotConfig[] = [
  { key: "breakfast", label: "Breakfast", emoji: "🍳", isMain: true, expectedWindow: "7 - 10 AM" },
  { key: "lunch", label: "Lunch", emoji: "🥗", isMain: true, expectedWindow: "12 - 2 PM" },
  { key: "dinner", label: "Dinner", emoji: "🍲", isMain: true, expectedWindow: "7 - 9 PM" },
  { key: "snack", label: "Snacks", emoji: "🍎", isMain: false, expectedWindow: "Anytime" },
];

export function MealSlotTracker({
  meals,
  onPressSlot,
  onOpenRemindersModal,
}: MealSlotTrackerProps) {
  const currentHour = new Date().getHours();

  const breakfastMeal = meals.find((m) => m.mealType === "breakfast" && !m.isSkipped);
  const lunchMeal = meals.find((m) => m.mealType === "lunch" && !m.isSkipped);
  const dinnerMeal = meals.find((m) => m.mealType === "dinner" && !m.isSkipped);
  const snackMeals = meals.filter((m) => m.mealType === "snack" && !m.isSkipped);

  const mainMealsLoggedCount =
    (breakfastMeal ? 1 : 0) + (lunchMeal ? 1 : 0) + (dinnerMeal ? 1 : 0);
  const allMainLogged = mainMealsLoggedCount === 3;

  const handleSlotPress = (slot: "breakfast" | "lunch" | "dinner" | "snack") => {
    lightImpact();
    onPressSlot(slot);
  };

  const handleRemindersPress = () => {
    lightImpact();
    onOpenRemindersModal();
  };

  const getSlotState = (slot: SlotConfig) => {
    if (slot.key === "breakfast") {
      if (breakfastMeal) return { state: "logged", meal: breakfastMeal };
      if (currentHour < 12) return { state: "due", label: "Due now" };
      return { state: "missing", label: "Not logged" };
    }

    if (slot.key === "lunch") {
      if (lunchMeal) return { state: "logged", meal: lunchMeal };
      if (currentHour >= 11 && currentHour < 17) return { state: "due", label: "Due now" };
      if (currentHour >= 17) return { state: "missing", label: "Not logged" };
      return { state: "upcoming", label: "Upcoming (12-2 PM)" };
    }

    if (slot.key === "dinner") {
      if (dinnerMeal) return { state: "logged", meal: dinnerMeal };
      if (currentHour >= 18) return { state: "due", label: "Due now" };
      return { state: "upcoming", label: "Upcoming (7-9 PM)" };
    }

    // Snacks
    const totalKcal = snackMeals.reduce((acc, m) => acc + m.totalKcal, 0);
    if (snackMeals.length > 0) {
      return {
        state: "logged",
        count: snackMeals.length,
        totalKcal,
      };
    }
    return { state: "optional", label: "Optional" };
  };

  return (
    <Card style={styles.card}>
      {/* Header with Title, Progress count, and Smart Reminders Bell */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>DAILY MEAL TRACKER</Text>
          <Text style={styles.subtitle}>
            {allMainLogged
              ? "All 3 main meals logged today"
              : `${mainMealsLoggedCount} of 3 main meals recorded`}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.remindersPill,
            pressed && styles.remindersPillPressed,
          ]}
          onPress={handleRemindersPress}
          accessibilityRole="button"
          accessibilityLabel="Smart Meal Reminders settings"
        >
          <IconBell size={13} color={colors.brand.primary} strokeWidth={2.2} />
          <Text style={styles.remindersPillText}>Reminders</Text>
        </Pressable>
      </View>

      {/* 3-Segment Visual Fill Bar for Breakfast, Lunch, Dinner */}
      <View style={styles.segmentBarContainer}>
        <View
          style={[
            styles.segmentBar,
            breakfastMeal
              ? styles.segmentFilled
              : currentHour >= 12
              ? styles.segmentMissing
              : styles.segmentDue,
          ]}
        />
        <View
          style={[
            styles.segmentBar,
            lunchMeal
              ? styles.segmentFilled
              : currentHour >= 17
              ? styles.segmentMissing
              : currentHour >= 11
              ? styles.segmentDue
              : styles.segmentPending,
          ]}
        />
        <View
          style={[
            styles.segmentBar,
            dinnerMeal
              ? styles.segmentFilled
              : currentHour >= 18
              ? styles.segmentDue
              : styles.segmentPending,
          ]}
        />
      </View>

      {/* 4 Interactive Slot Rows */}
      <View style={styles.slotsList}>
        {SLOTS.map((slot) => {
          const slotState = getSlotState(slot);
          const isLogged = slotState.state === "logged";
          const isDue = slotState.state === "due";
          const isMissing = slotState.state === "missing";

          return (
            <Pressable
              key={slot.key}
              style={({ pressed }) => [
                styles.slotRow,
                isDue && styles.slotRowDue,
                isMissing && styles.slotRowMissing,
                pressed && styles.slotRowPressed,
              ]}
              onPress={() => handleSlotPress(slot.key)}
              accessibilityRole="button"
              accessibilityLabel={`${slot.label}: ${
                isLogged ? "Logged" : isDue ? "Due now" : isMissing ? "Not logged" : "Upcoming"
              }`}
            >
              {/* Left: Emoji + Name + Subtitle */}
              <View style={styles.slotLeft}>
                <View
                  style={[
                    styles.emojiCircle,
                    isLogged && styles.emojiCircleLogged,
                    isDue && styles.emojiCircleDue,
                  ]}
                >
                  <Text style={styles.emojiText}>{slot.emoji}</Text>
                </View>

                <View style={styles.slotMeta}>
                  <View style={styles.slotTitleRow}>
                    <Text style={styles.slotName}>{slot.label}</Text>
                    {isDue && <View style={styles.dueDot} />}
                  </View>

                  {isLogged ? (
                    <Text style={styles.slotSummaryLogged}>
                      {slot.key === "snack"
                        ? `${(slotState as any).count} logged · ${(slotState as any).totalKcal} kcal`
                        : `${(slotState as any).meal?.totalKcal ?? 0} kcal · Logged`}
                    </Text>
                  ) : isDue ? (
                    <Text style={styles.slotSummaryDue}>
                      Due now · Tap to snap or log
                    </Text>
                  ) : isMissing ? (
                    <Text style={styles.slotSummaryMissing}>
                      Not logged · Tap to backfill
                    </Text>
                  ) : (
                    <Text style={styles.slotSummaryUpcoming}>
                      {slot.expectedWindow}
                    </Text>
                  )}
                </View>
              </View>

              {/* Right Action / Status Badge */}
              <View style={styles.slotRight}>
                {isLogged ? (
                  <View style={styles.loggedBadge}>
                    <IconCheck size={14} color={colors.semantic.success} strokeWidth={2.4} />
                    <Text style={styles.loggedBadgeText}>Done</Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.actionBtn,
                      isDue && styles.actionBtnDue,
                      isMissing && styles.actionBtnMissing,
                    ]}
                  >
                    <IconPlus
                      size={13}
                      color={isDue ? colors.text.inverse : colors.brand.primary}
                      strokeWidth={2.6}
                    />
                    <Text
                      style={[
                        styles.actionBtnText,
                        isDue && styles.actionBtnTextDue,
                      ]}
                    >
                      {isDue ? "Log Now" : isMissing ? "Log" : "Add"}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderColor: colors.border.subtle,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sectionTitle: {
    ...typography.badge,
    color: colors.text.muted,
    letterSpacing: 0.8,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  remindersPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brand.primaryLight,
    borderWidth: 1,
    borderColor: "rgba(27, 73, 49, 0.15)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  remindersPillPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  remindersPillText: {
    ...typography.badge,
    color: colors.brand.primary,
    fontWeight: "600",
  },
  segmentBarContainer: {
    flexDirection: "row",
    gap: 6,
    marginVertical: 2,
  },
  segmentBar: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
  },
  segmentFilled: {
    backgroundColor: colors.brand.primary,
  },
  segmentDue: {
    backgroundColor: colors.brand.accent,
  },
  segmentMissing: {
    backgroundColor: colors.semantic.warn,
  },
  segmentPending: {
    backgroundColor: colors.border.subtle,
  },
  slotsList: {
    gap: spacing.xs,
    marginTop: 2,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bg.canvas,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  slotRowDue: {
    borderColor: colors.brand.primary,
    backgroundColor: "#F4F8F5",
  },
  slotRowMissing: {
    borderColor: "rgba(217, 119, 6, 0.35)",
    backgroundColor: "#FFFDF5",
  },
  slotRowPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.9,
  },
  slotLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  emojiCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.bg.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  emojiCircleLogged: {
    backgroundColor: colors.brand.primaryLight,
    borderColor: "rgba(27, 73, 49, 0.2)",
  },
  emojiCircleDue: {
    backgroundColor: "#E8F0EA",
    borderColor: colors.brand.primary,
  },
  emojiText: {
    fontSize: 16,
  },
  slotMeta: {
    flex: 1,
  },
  slotTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  slotName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: "600",
  },
  dueDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.brand.accent,
  },
  slotSummaryLogged: {
    ...typography.badge,
    color: colors.semantic.success,
    fontWeight: "600",
    marginTop: 1,
  },
  slotSummaryDue: {
    ...typography.badge,
    color: colors.brand.accent,
    fontWeight: "600",
    marginTop: 1,
  },
  slotSummaryMissing: {
    ...typography.badge,
    color: colors.semantic.warn,
    fontWeight: "600",
    marginTop: 1,
  },
  slotSummaryUpcoming: {
    ...typography.badge,
    color: colors.text.muted,
    marginTop: 1,
  },
  slotRight: {
    marginLeft: spacing.xs,
  },
  loggedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.semantic.successLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  loggedBadgeText: {
    ...typography.badge,
    color: colors.semantic.success,
    fontWeight: "700",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.brand.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  actionBtnDue: {
    backgroundColor: colors.brand.primary,
  },
  actionBtnMissing: {
    backgroundColor: colors.brand.primaryLight,
  },
  actionBtnText: {
    ...typography.badge,
    color: colors.brand.primary,
    fontWeight: "700",
  },
  actionBtnTextDue: {
    color: colors.text.inverse,
  },
});

