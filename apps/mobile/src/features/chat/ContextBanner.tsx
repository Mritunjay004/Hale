import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";

export const ContextBanner = React.memo(function ContextBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>🧠</Text>
      <View style={styles.textGroup}>
        <Text style={styles.title}>GROUNDED CLINICAL CONTEXT ACTIVE</Text>
        <Text style={styles.sub}>
          Synced with your goal targets, today's meal logs, and latest lab biomarkers.
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brand.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xxs,
    gap: spacing.sm,
  },
  icon: {
    fontSize: 18,
  },
  textGroup: {
    flex: 1,
    gap: 1,
  },
  title: {
    ...typography.badge,
    color: colors.brand.primary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sub: {
    ...typography.badge,
    color: colors.text.secondary,
    fontSize: 10,
    lineHeight: 13,
  },
});

