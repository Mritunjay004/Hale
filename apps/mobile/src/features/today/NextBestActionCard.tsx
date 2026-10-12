import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { Card } from "../../ui/Card";
import { IconArrowRight } from "../../ui/icons";
import type { NextBestAction } from "@hale/shared";

interface NextBestActionCardProps {
  action: NextBestAction;
  onPressAction: () => void;
}

export function NextBestActionCard({ action, onPressAction }: NextBestActionCardProps) {
  const isComplete = action.priority === "P3" || action.actionType === "complete";

  const priorityLabel =
    action.priority === "P1"
      ? "HIGH PRIORITY"
      : action.priority === "P2"
      ? "RECOMMENDED"
      : "ALL SET";

  return (
    <Card style={[styles.card, isComplete && styles.completeCard]}>
      <View style={styles.headerRow}>
        <View style={[styles.priorityPill, isComplete && styles.completePill]}>
          <Text style={[styles.priorityText, isComplete && styles.completePriorityText]}>
            {priorityLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{action.title}</Text>
      <Text style={styles.subtitle}>{action.subtitle}</Text>

      <Pressable
        style={({ pressed }) => [
          styles.actionBtn,
          isComplete && styles.completeBtn,
          pressed && styles.actionBtnPressed,
        ]}
        onPress={onPressAction}
        accessibilityRole="button"
        accessibilityLabel={action.ctaText}
      >
        <Text style={[styles.actionBtnText, isComplete && styles.completeBtnText]}>
          {action.ctaText}
        </Text>
        <View style={styles.arrowWrapper}>
          <IconArrowRight
            size={16}
            color={isComplete ? colors.text.inverse : colors.brand.primary}
            strokeWidth={2.4}
          />
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
    gap: spacing.xs,
  },
  completeCard: {
    backgroundColor: "#1D3557",
    borderColor: "#1D3557",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priorityPill: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  completePill: {
    backgroundColor: "rgba(82, 183, 136, 0.25)",
    borderColor: "rgba(82, 183, 136, 0.4)",
  },
  priorityText: {
    ...typography.badge,
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  completePriorityText: {
    color: "#D8F3DC",
  },
  title: {
    ...typography.h3,
    color: colors.text.inverse,
    marginTop: 2,
  },
  subtitle: {
    ...typography.caption,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 46,
    backgroundColor: colors.bg.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  actionBtnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  arrowWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  completeBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  actionBtnText: {
    ...typography.bodyMedium,
    color: colors.brand.primary,
    fontWeight: "700",
  },
  completeBtnText: {
    color: colors.text.inverse,
  },
});

