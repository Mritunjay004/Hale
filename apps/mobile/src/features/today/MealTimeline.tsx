import React from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { Card } from "../../ui/Card";
import type { MealRecord } from "@hale/shared";

interface MealTimelineProps {
  meals: MealRecord[];
  onDeleteMeal: (mealId: string) => Promise<void>;
  onPressLogMeal: () => void;
}

const MEAL_ICONS: Record<string, string> = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍲",
  snack: "🍎",
};

const SOURCE_LABELS: Record<string, string> = {
  voice: "🎙️ Voice",
  camera: "📸 Photo",
  text: "✍️ Quick Log",
  chat: "💬 Coach Chat",
  manual: "📝 Manual",
};

export function MealTimeline({ meals, onDeleteMeal, onPressLogMeal }: MealTimelineProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const confirmDelete = (mealId: string, mealType: string) => {
    Alert.alert(
      `Delete ${mealType.toUpperCase()}?`,
      "This will remove the logged meal and recalculate today's totals.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(mealId);
            try {
              await onDeleteMeal(mealId);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  if (!meals || meals.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyEmoji}>🍽️</Text>
        <Text style={styles.emptyTitle}>No meals logged yet today</Text>
        <Text style={styles.emptySubtitle}>
          Speaking or snapping your meal takes less than 10 seconds.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.85 }]}
          onPress={onPressLogMeal}
          accessibilityRole="button"
          accessibilityLabel="Log your first meal"
        >
          <Text style={styles.emptyBtnText}>+ Log First Meal</Text>
        </Pressable>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TODAY'S TIMELINE</Text>
        <Text style={styles.mealCountBadge}>{meals.length} logged</Text>
      </View>

      {meals.map((meal) => {
        const icon = MEAL_ICONS[meal.mealType] ?? "🍽️";
        const sourceLabel = SOURCE_LABELS[meal.source] ?? "✍️ Log";
        const dateObj = new Date(meal.loggedAt ?? meal.createdAt);
        const timeStr = dateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

        return (
          <Card key={meal.id} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <View style={styles.mealBadgeGroup}>
                <Text style={styles.mealIcon}>{icon}</Text>
                <View>
                  <Text style={styles.mealTypeName}>
                    {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                  </Text>
                  <Text style={styles.timeLabel}>{timeStr} · {sourceLabel}</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
                onPress={() => confirmDelete(meal.id, meal.mealType)}
                accessibilityLabel={`Delete ${meal.mealType}`}
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
              </Pressable>
            </View>

            {/* Items Breakdown */}
            {meal.items && meal.items.length > 0 ? (
              <View style={styles.itemsList}>
                {meal.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName}>
                      • {item.quantity} {item.unit} {item.name}
                    </Text>
                    <Text style={styles.itemKcal}>{item.kcal} kcal</Text>
                  </View>
                ))}
              </View>
            ) : meal.rawInput ? (
              <Text style={styles.rawInputText}>"{meal.rawInput}"</Text>
            ) : null}

            {/* Macros summary bar */}
            <View style={styles.macroSummaryRow}>
              <Text style={styles.totalKcalBadge}>{meal.totalKcal} kcal</Text>
              <Text style={styles.macroDetail}>
                {meal.proteinG}g P · {meal.carbsG}g C · {meal.fatG}g F
              </Text>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.badge,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  mealCountBadge: {
    ...typography.badge,
    color: colors.brand.primary,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.xs,
    backgroundColor: colors.bg.surface,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 260,
  },
  emptyBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.brand.primaryLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  emptyBtnText: {
    ...typography.caption,
    color: colors.brand.primary,
    fontWeight: "700",
  },
  mealCard: {
    gap: spacing.xs,
    backgroundColor: colors.bg.surface,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealBadgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  mealIcon: {
    fontSize: 20,
  },
  mealTypeName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: "700",
  },
  timeLabel: {
    ...typography.badge,
    color: colors.text.muted,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  deleteIcon: {
    fontSize: 16,
  },
  itemsList: {
    backgroundColor: colors.bg.canvas,
    padding: spacing.xs,
    borderRadius: radius.sm,
    gap: 3,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    ...typography.caption,
    color: colors.text.primary,
    flex: 1,
  },
  itemKcal: {
    ...typography.badge,
    color: colors.text.secondary,
  },
  rawInputText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: "italic",
  },
  macroSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.xs,
  },
  totalKcalBadge: {
    ...typography.caption,
    color: colors.brand.primary,
    fontWeight: "700",
  },
  macroDetail: {
    ...typography.badge,
    color: colors.text.muted,
  },
});

