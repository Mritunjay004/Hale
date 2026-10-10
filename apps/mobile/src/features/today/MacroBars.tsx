import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";

interface MacroBarsProps {
  currentProteinG: number;
  targetProteinG: number;
  currentCarbsG: number;
  targetCarbsG: number;
  currentFatG: number;
  targetFatG: number;
}

export function MacroBars({
  currentProteinG,
  targetProteinG,
  currentCarbsG,
  targetCarbsG,
  currentFatG,
  targetFatG,
}: MacroBarsProps) {
  const macros = [
    {
      name: "Protein",
      current: currentProteinG,
      target: targetProteinG,
      color: colors.brand.primary,
      bgColor: colors.brand.primaryLight,
    },
    {
      name: "Carbs",
      current: currentCarbsG,
      target: targetCarbsG,
      color: "#2A9D8F",
      bgColor: "#E8F5F3",
    },
    {
      name: "Fat",
      current: currentFatG,
      target: targetFatG,
      color: "#E76F51",
      bgColor: "#FDF2EF",
    },
  ];

  return (
    <View style={styles.container}>
      {macros.map((m) => {
        const remaining = Math.max(0, m.target - m.current);
        const progress = m.target > 0 ? Math.min(1, Math.max(0, m.current / m.target)) : 0;
        const isMet = m.current >= m.target;

        return (
          <View key={m.name} style={styles.macroItem}>
            <View style={styles.headerRow}>
              <Text style={styles.macroName}>{m.name}</Text>
              <Text style={styles.microcopy}>
                {isMet ? "Goal met! 🎉" : `${remaining}g to go`}
              </Text>
            </View>

            <View style={[styles.track, { backgroundColor: m.bgColor }]}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: m.color,
                    width: `${Math.round(progress * 100)}%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.valueRow}>
              {m.current}g <Text style={styles.targetMuted}>/ {m.target}g</Text>
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    flex: 1,
  },
  macroItem: {
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  macroName: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: "700",
  },
  microcopy: {
    ...typography.badge,
    color: colors.text.secondary,
  },
  track: {
    height: 8,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: radius.full,
  },
  valueRow: {
    ...typography.badge,
    color: colors.text.primary,
    fontWeight: "600",
  },
  targetMuted: {
    color: colors.text.muted,
    fontWeight: "400",
  },
});

