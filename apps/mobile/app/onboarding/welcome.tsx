import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, typography } from "../../src/theme/tokens.js";
import { Button } from "../../src/ui/Button.js";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🌿 Hale</Text>
        <Text style={styles.tagline}>
          The personal health assistant that does the work for you.
        </Text>
        <Text style={styles.sub}>
          Log meals in 10s via voice or photo. Understand what to improve and why.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          label="Get Started →"
          onPress={() => router.replace("/(tabs)")}
          style={{ width: "100%" }}
        />
        <Button
          label="Try with sample data"
          variant="outline"
          onPress={() => router.replace("/(tabs)")}
          style={{ width: "100%", marginTop: spacing.sm }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
    padding: spacing.xl,
    justifyContent: "space-between",
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  logo: {
    ...typography.display,
    color: colors.brand.primary,
  },
  tagline: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: "center",
  },
  sub: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 300,
  },
  footer: {
    width: "100%",
    paddingBottom: spacing.lg,
  },
});

