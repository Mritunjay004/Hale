import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../src/theme/tokens";

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>💬 Coach Assistant</Text>
      <Text style={styles.sub}>
        Grounded health guidance and natural meal logging.
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

