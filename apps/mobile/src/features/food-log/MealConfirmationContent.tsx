import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { api } from "../../lib/api-client";
import { generateUUID } from "../../lib/uuid";
import { lightImpact, mediumImpact, successNotification } from "../../lib/haptics";
import type { ParsedMeal, MealItem, MealType, MealSource } from "@hale/shared";

interface ConfirmationSheetProps {
  parsedMeal: ParsedMeal;
  source: MealSource;
  rawInput?: string;
  loggedMeals?: Array<{ mealType: MealType; loggedAt?: string; totalKcal?: number }>;
  suggestedMealType?: string;
  onSaved: () => void;
  onBack: () => void;
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

export function MealConfirmationContent({
  parsedMeal,
  source,
  rawInput,
  loggedMeals,
  suggestedMealType,
  onSaved,
  onBack,
}: ConfirmationSheetProps) {
  // Count meals logged today
  const loggedCounts: Record<MealType, number> = {
    breakfast: 0,
    lunch: 0,
    snack: 0,
    dinner: 0,
  };
  for (const m of loggedMeals ?? []) {
    if (m.mealType in loggedCounts) {
      loggedCounts[m.mealType as MealType]++;
    }
  }

  // Intelligent initial meal type selection:
  // 1. If user tapped a specific CTA (e.g. "Log Lunch"), respect suggestedMealType
  // 2. If dinner was already logged today and AI returned dinner, auto-select snack to avoid accidental duplicate dinners
  // 3. Otherwise use parsedMeal.mealType
  const resolveInitialMealType = (): MealType => {
    if (suggestedMealType && MEAL_TYPES.includes(suggestedMealType as MealType)) {
      return suggestedMealType as MealType;
    }
    if (parsedMeal.mealType === "dinner" && loggedCounts.dinner > 0) {
      return "snack";
    }
    return parsedMeal.mealType;
  };

  const [mealType, setMealType] = useState<MealType>(resolveInitialMealType);
  const [items, setItems] = useState<MealItem[]>(parsedMeal.items);
  const [isSaving, setIsSaving] = useState(false);
  const isSkipped = parsedMeal.isSkipped;

  const isDuplicateMealType = mealType !== "snack" && (loggedCounts[mealType] ?? 0) > 0;

  // Live recalculate totals
  const totalKcal = items.reduce((sum, item) => sum + item.kcal, 0);
  const totalProtein = Math.round(items.reduce((sum, item) => sum + item.proteinG, 0) * 10) / 10;
  const totalCarbs = Math.round(items.reduce((sum, item) => sum + item.carbsG, 0) * 10) / 10;
  const totalFat = Math.round(items.reduce((sum, item) => sum + item.fatG, 0) * 10) / 10;

  // Stepper handlers
  const updateQuantity = (index: number, delta: number) => {
    lightImpact();
    setItems((prev) => {
      const updated = [...prev];
      const target = updated[index];
      if (!target) return prev;

      const newQty = Math.max(0.5, target.quantity + delta);
      const ratio = newQty / target.quantity;

      updated[index] = {
        ...target,
        quantity: Math.round(newQty * 10) / 10,
        kcal: Math.round(target.kcal * ratio),
        proteinG: Math.round(target.proteinG * ratio * 10) / 10,
        carbsG: Math.round(target.carbsG * ratio * 10) / 10,
        fatG: Math.round(target.fatG * ratio * 10) / 10,
      };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    mediumImpact();
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const executeSave = async (targetType: MealType) => {
    setIsSaving(true);
    try {
      const idempotencyKey = generateUUID();
      await api.post("/meals", {
        mealType: targetType,
        source,
        rawInput,
        items,
        totalKcal,
        proteinG: totalProtein,
        carbsG: totalCarbs,
        fatG: totalFat,
        confidence: parsedMeal.confidence,
        isSkipped,
        idempotencyKey,
      });

      successNotification();
      onSaved();
    } catch (err) {
      console.error("Failed to save meal:", err);
      Alert.alert(
        "Could Not Save Meal",
        err instanceof Error ? err.message : "An unexpected error occurred while saving."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (isDuplicateMealType) {
      const typeCapitalized = mealType.charAt(0).toUpperCase() + mealType.slice(1);
      Alert.alert(
        `Additional ${typeCapitalized}?`,
        `You already have ${loggedCounts[mealType]} ${typeCapitalized} logged today. Do you want to save this as an additional ${typeCapitalized} portion, or switch to Snack?`,
        [
          {
            text: "Save as Snack",
            onPress: () => {
              setMealType("snack");
              executeSave("snack");
            },
          },
          {
            text: `Confirm 2nd ${typeCapitalized}`,
            onPress: () => {
              executeSave(mealType);
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
      return;
    }

    executeSave(mealType);
  };

  if (isSkipped) {
    return (
      <View style={styles.skippedContainer}>
        <Text style={styles.skippedIcon}>☕️</Text>
        <Text style={styles.skippedTitle}>Skipped Meal</Text>
        <Text style={styles.skippedSub}>
          Recorded with 0 calories. Your daily consistency and streak are preserved.
        </Text>
        <Button
          label={isSaving ? "Saving..." : "Confirm & Save"}
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          style={{ width: "100%", marginTop: spacing.md }}
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Meal Type Chips */}
      <View style={styles.mealTypeRow}>
        {MEAL_TYPES.map((t) => {
          const isSelected = mealType === t;
          const count = loggedCounts[t];
          const hasLogged = t !== "snack" && count > 0;
          return (
            <Pressable
              key={t}
              style={[styles.typeChip, isSelected && styles.typeChipActive]}
              onPress={() => setMealType(t)}
            >
              <Text
                style={[
                  styles.typeChipText,
                  isSelected && styles.typeChipTextActive,
                ]}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {hasLogged ? ` (${count})` : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Duplicate Warning Banner */}
      {isDuplicateMealType && (
        <View style={styles.duplicateWarningBanner}>
          <Text style={styles.duplicateWarningIcon}>⚠️</Text>
          <View style={styles.duplicateWarningContent}>
            <Text style={styles.duplicateWarningTitle}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)} already logged today ({loggedCounts[mealType]} {loggedCounts[mealType] === 1 ? "entry" : "entries"})
            </Text>
            <Text style={styles.duplicateWarningSub}>
              Saving will add an additional {mealType} portion. If this was an evening bite or dessert, tap "Snack" above.
            </Text>
          </View>
        </View>
      )}

      {/* Live Totals Card */}
      <Card style={styles.totalsCard}>
        <View style={styles.totalsTop}>
          <Text style={styles.totalsKcal}>{totalKcal} kcal</Text>
          <View style={styles.confidencePill}>
            <Text style={styles.confidenceText}>
              {parsedMeal.confidence === "high" ? "✓ High Confidence" : "~ Estimated"}
            </Text>
          </View>
        </View>

        <View style={styles.macrosStrip}>
          <Text style={styles.macroStat}>Protein: {totalProtein}g</Text>
          <Text style={styles.macroStat}>Carbs: {totalCarbs}g</Text>
          <Text style={styles.macroStat}>Fat: {totalFat}g</Text>
        </View>
      </Card>

      {/* Itemized List with Steppers */}
      <View style={styles.itemsList}>
        <Text style={styles.itemsHeader}>Identified Items ({items.length})</Text>

        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemInfoCol}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMacros}>
                {item.kcal} kcal · {item.proteinG}g P · {item.carbsG}g C
              </Text>
            </View>

            {/* Quantity Stepper */}
            <View style={styles.stepperContainer}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => updateQuantity(index, -1)}
                hitSlop={8}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>

              <Text style={styles.qtyText}>
                {item.quantity} {item.unit}
              </Text>

              <Pressable
                style={styles.stepperBtn}
                onPress={() => updateQuantity(index, 1)}
                hitSlop={8}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>

              {/* Remove button */}
              <Pressable
                style={styles.deleteBtn}
                onPress={() => removeItem(index)}
                hitSlop={8}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      {/* Save Action */}
      <View style={styles.actionsFooter}>
        <Button
          label={isSaving ? "Saving Meal..." : `Save ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} (${totalKcal} kcal)`}
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving || items.length === 0}
          style={{ width: "100%", height: 50 }}
        />
        <Pressable onPress={onBack} style={styles.editInputLink}>
          <Text style={styles.editInputLinkText}>← Back to input</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  mealTypeRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  duplicateWarningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  duplicateWarningIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  duplicateWarningContent: {
    flex: 1,
  },
  duplicateWarningTitle: {
    ...typography.caption,
    fontWeight: "700",
    color: "#92400E",
  },
  duplicateWarningSub: {
    ...typography.caption,
    fontSize: 12,
    color: "#B45309",
    marginTop: 2,
    lineHeight: 16,
  },
  typeChip: {
    flex: 1,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.md,
    alignItems: "center",
  },
  typeChipActive: {
    backgroundColor: colors.brand.primary,
  },
  typeChipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  typeChipTextActive: {
    color: colors.text.inverse,
  },
  totalsCard: {
    backgroundColor: colors.brand.primaryLight,
    borderColor: colors.brand.primaryLight,
    gap: spacing.xs,
  },
  totalsTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalsKcal: {
    ...typography.h1,
    color: colors.brand.primary,
  },
  confidencePill: {
    backgroundColor: "rgba(27, 73, 49, 0.12)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  confidenceText: {
    ...typography.badge,
    color: colors.brand.primary,
  },
  macrosStrip: {
    flexDirection: "row",
    gap: spacing.md,
  },
  macroStat: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  itemsList: {
    gap: spacing.xs,
  },
  itemsHeader: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bg.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  itemInfoCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: "600",
  },
  itemMacros: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: "600",
  },
  qtyText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "center",
  },
  deleteBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xxs,
  },
  deleteBtnText: {
    fontSize: 14,
    color: colors.text.muted,
  },
  actionsFooter: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  editInputLink: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  editInputLinkText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  skippedContainer: {
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  skippedIcon: {
    fontSize: 48,
  },
  skippedTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  skippedSub: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 280,
  },
});

