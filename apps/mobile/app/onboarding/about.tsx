import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, radius, typography } from "../../src/theme/tokens";
import { Button } from "../../src/ui/Button";
import { Card } from "../../src/ui/Card";
import { OnboardingHeader } from "../../src/features/onboarding/OnboardingHeader";
import { useOnboardingStore } from "../../src/features/onboarding/store";

export default function AboutYouScreen() {
  const router = useRouter();
  const store = useOnboardingStore();

  const [useImperial, setUseImperial] = useState(store.useImperial);
  const [age, setAge] = useState(store.age.toString());
  const [sex, setSex] = useState<"male" | "female">(store.sex);
  
  // Metric defaults
  const [heightCm, setHeightCm] = useState(store.heightCm.toString());
  const [weightKg, setWeightKg] = useState(store.weightKg.toString());

  // Imperial conversions (cm -> feet/inches, kg -> lbs)
  const initialFeet = Math.floor(store.heightCm / 30.48);
  const initialInches = Math.round((store.heightCm % 30.48) / 2.54);
  const initialLbs = Math.round(store.weightKg * 2.20462);

  const [heightFeet, setHeightFeet] = useState(initialFeet.toString());
  const [heightInches, setHeightInches] = useState(initialInches.toString());
  const [weightLbs, setWeightLbs] = useState(initialLbs.toString());

  const handleNext = () => {
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 14 || ageNum > 100) {
      Alert.alert("Please check age", "Enter an age between 14 and 100.");
      return;
    }

    let finalHeightCm = 0;
    let finalWeightKg = 0;

    if (useImperial) {
      const feet = parseFloat(heightFeet) || 0;
      const inches = parseFloat(heightInches) || 0;
      finalHeightCm = Math.round(feet * 30.48 + inches * 2.54);
      finalWeightKg = Math.round((parseFloat(weightLbs) || 0) / 2.20462 * 10) / 10;
    } else {
      finalHeightCm = parseFloat(heightCm) || 0;
      finalWeightKg = parseFloat(weightKg) || 0;
    }

    if (finalHeightCm < 100 || finalHeightCm > 240) {
      Alert.alert("Height check", "Please enter a valid height.");
      return;
    }

    if (finalWeightKg < 35 || finalWeightKg > 250) {
      Alert.alert("Weight check", "Please enter a valid weight.");
      return;
    }

    store.updateData({
      age: ageNum,
      sex,
      heightCm: finalHeightCm,
      weightKg: finalWeightKg,
      useImperial,
    });

    router.push("/onboarding/goal");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OnboardingHeader
        currentStep={2}
        title="About You"
        subtitle="Used for Mifflin-St Jeor basal metabolic rate (BMR) calculation."
      />

      {/* Metric vs Imperial Toggle */}
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.unitToggle, !useImperial && styles.unitToggleActive]}
          onPress={() => setUseImperial(false)}
        >
          <Text style={[styles.unitText, !useImperial && styles.unitTextActive]}>
            Metric (cm / kg)
          </Text>
        </Pressable>

        <Pressable
          style={[styles.unitToggle, useImperial && styles.unitToggleActive]}
          onPress={() => setUseImperial(true)}
        >
          <Text style={[styles.unitText, useImperial && styles.unitTextActive]}>
            Imperial (ft / lbs)
          </Text>
        </Pressable>
      </View>

      {/* Sex Selector */}
      <Card style={styles.cardSection}>
        <Text style={styles.fieldLabel}>Biological Sex</Text>
        <Text style={styles.fieldNote}>Required for hormone & lean mass BMR baseline</Text>
        <View style={styles.sexRow}>
          <Pressable
            style={[styles.sexOption, sex === "male" && styles.sexOptionActive]}
            onPress={() => setSex("male")}
          >
            <Text style={styles.sexEmoji}>👨</Text>
            <Text style={[styles.sexLabel, sex === "male" && styles.sexLabelActive]}>
              Male
            </Text>
          </Pressable>

          <Pressable
            style={[styles.sexOption, sex === "female" && styles.sexOptionActive]}
            onPress={() => setSex("female")}
          >
            <Text style={styles.sexEmoji}>👩</Text>
            <Text style={[styles.sexLabel, sex === "female" && styles.sexLabelActive]}>
              Female
            </Text>
          </Pressable>
        </View>
      </Card>

      {/* Age & Height */}
      <Card style={styles.cardSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>Age</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={age}
            onChangeText={setAge}
            placeholder="e.g. 28"
          />
        </View>

        {useImperial ? (
          <View style={styles.dualInputGroup}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Height (Feet)</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={heightFeet}
                onChangeText={setHeightFeet}
                placeholder="5"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Inches</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={heightInches}
                onChangeText={setHeightInches}
                placeholder="9"
              />
            </View>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="e.g. 175"
            />
          </View>
        )}

        {/* Weight */}
        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>
            Current Weight ({useImperial ? "lbs" : "kg"})
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={useImperial ? weightLbs : weightKg}
            onChangeText={useImperial ? setWeightLbs : setWeightKg}
            placeholder={useImperial ? "e.g. 165" : "e.g. 75"}
          />
        </View>
      </Card>

      <Button
        label="Continue to Goals →"
        onPress={handleNext}
        style={{ marginTop: spacing.md, height: 50 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing["4xl"],
    gap: spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.md,
    padding: 3,
  },
  unitToggle: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  unitToggleActive: {
    backgroundColor: colors.bg.surface,
  },
  unitText: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: "500",
  },
  unitTextActive: {
    color: colors.brand.primary,
    fontWeight: "600",
  },
  cardSection: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: "600",
  },
  fieldNote: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: -4,
  },
  sexRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sexOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  sexOptionActive: {
    backgroundColor: colors.brand.primaryLight,
    borderColor: colors.brand.primary,
  },
  sexEmoji: {
    fontSize: 20,
  },
  sexLabel: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  sexLabelActive: {
    color: colors.brand.primary,
    fontWeight: "600",
  },
  inputGroup: {
    gap: spacing.xxs,
  },
  dualInputGroup: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
});

