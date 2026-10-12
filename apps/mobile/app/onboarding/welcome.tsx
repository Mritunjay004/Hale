import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, radius, typography } from "../../src/theme/tokens";
import { Button } from "../../src/ui/Button";
import { HaleLogo } from "../../src/ui/HaleLogo";
import { api } from "../../src/lib/api-client";

export default function WelcomeScreen() {
  const router = useRouter();

  const handleSeedDemo = async () => {
    try {
      await api.post("/dev/seed-demo");
      router.replace("/(tabs)");
    } catch {
      router.replace("/(tabs)");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoBadge}>
          <HaleLogo size={56} backgroundColor="transparent" />
        </View>

        <Text style={styles.brandTitle}>Hale</Text>
        <Text style={styles.tagline}>
          The personal health assistant that does the work for you.
        </Text>

        <View style={styles.valuePropsCard}>
          <View style={styles.propRow}>
            <Text style={styles.propIcon}>🎙</Text>
            <View style={styles.propTextCol}>
              <Text style={styles.propHeading}>Log meals in under 10 seconds</Text>
              <Text style={styles.propSub}>Speak naturally or snap a plate photo</Text>
            </View>
          </View>

          <View style={styles.propRow}>
            <Text style={styles.propIcon}>🎯</Text>
            <View style={styles.propTextCol}>
              <Text style={styles.propHeading}>Actionable daily targets</Text>
              <Text style={styles.propSub}>Know your numbers and the physiology behind them</Text>
            </View>
          </View>

          <View style={styles.propRow}>
            <Text style={styles.propIcon}>📄</Text>
            <View style={styles.propTextCol}>
              <Text style={styles.propHeading}>Turn lab tests into habits</Text>
              <Text style={styles.propSub}>Biomarkers linked directly to daily nutrition</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          label="Build My Plan (90s) →"
          onPress={() => router.push("/onboarding/about")}
          style={styles.primaryButton}
        />

        <Button
          label="Try with sample data"
          variant="outline"
          onPress={handleSeedDemo}
          style={styles.secondaryButton}
        />

        <Text style={styles.privacyNotice}>
          🔒 Anonymous & device-bound. No sign-up required.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.xl,
    justifyContent: "space-between",
  },
  hero: {
    alignItems: "center",
    paddingTop: spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  logoEmoji: {
    fontSize: 32,
  },
  brandTitle: {
    ...typography.display,
    color: colors.brand.primary,
    marginBottom: spacing.xxs,
  },
  tagline: {
    ...typography.h3,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: spacing.xl,
  },
  valuePropsCard: {
    width: "100%",
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.md,
  },
  propRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  propIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  propTextCol: {
    flex: 1,
  },
  propHeading: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: "600",
  },
  propSub: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  footer: {
    width: "100%",
    gap: spacing.sm,
  },
  primaryButton: {
    width: "100%",
    height: 52,
  },
  secondaryButton: {
    width: "100%",
  },
  privacyNotice: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
