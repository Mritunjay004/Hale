import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../src/theme/tokens.js";

export default function ReportsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📄 Health Reports</Text>
      <Text style={styles.sub}>
        Upload lab documents to track biomarkers and generate goal-aligned focus habits.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
    padding: spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...typography.h2,
    color: colors.brand.primary,
  },
  sub: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});

