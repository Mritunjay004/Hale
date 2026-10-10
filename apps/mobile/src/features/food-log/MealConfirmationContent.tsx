import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { api } from "../../lib/api-client";
import { lightImpact, mediumImpact, successNotification } from "../../lib/haptics";
import type { ParsedMeal, MealItem, MealType, MealSource } from "@hale/shared";

interface ConfirmationSheetProps {
  parsedMeal: ParsedMeal;
  source: MealSource;
  rawInput?: string;
  onSaved: () => void;
  onBack: () => void;
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

export function MealConfirmationContent({
  parsedMeal,
  source,
  rawInput,
  onSaved,
  onBack,
}: ConfirmationSheetProps) {
  const [mealType, setMealType] = useState<MealType>(parsedMeal.mealType);
  const [items, setItems] = useState<MealItem[]>(parsedMeal.items);
  const [isSaving, setIsSaving] = useState(false);
  const isSkipped = parsedMeal.isSkipped;

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      await api.post("/meals", {
        mealType,
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
      console.error(err);
      onSaved();
    } finally {
      setIsSaving(false);
    }
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
              </Text>
            </Pressable>
          );
        })}
      </View>

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

