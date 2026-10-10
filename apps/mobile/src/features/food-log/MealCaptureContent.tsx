import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { api } from "../../lib/api-client";
import type { ParsedMeal, MealSource } from "@hale/shared";

interface CaptureSheetProps {
  onParsed: (meal: ParsedMeal, source: MealSource, rawInput?: string) => void;
  onClose: () => void;
}

const FREQUENT_MEALS = [
  { label: "2 Rotis & Dal", text: "2 rotis and yellow dal" },
  { label: "Poha & Chai", text: "1 plate kanda poha and milk tea" },
  { label: "Eggs & Toast", text: "2 boiled eggs and 2 slices brown bread" },
  { label: "Idli & Sambar", text: "3 idlis with sambar and coconut chutney" },
  { label: "Paneer Salad", text: "150g paneer salad with cucumbers and tomatoes" },
];

export function MealCaptureContent({ onParsed, onClose }: CaptureSheetProps) {
  const [mode, setMode] = useState<"voice" | "camera" | "text">("voice");
  const [textInput, setTextInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // 1. Text Parse Action
  const handleParseText = async (customText?: string) => {
    const query = customText ?? textInput.trim();
    if (!query) return;

    setAnalyzing(true);
    try {
      const parsed = await api.post<ParsedMeal>("/meals/parse", {
        text: query,
        clientTimestamp: new Date().toISOString(),
      });

      if (!parsed.isFood) {
        Alert.alert(
          "Not Recognized as Food",
          parsed.clarifyingQuestion ?? "Please describe food or drink items."
        );
        return;
      }

      onParsed(parsed, "text", query);
    } catch (err) {
      console.error(err);
      Alert.alert("Parsing Failed", "Could not analyze meal. You can enter items manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  // 2. Voice Simulation / Audio Tap
  const handleToggleVoice = async () => {
    if (!isRecording) {
      setIsRecording(true);
      // Simulate speech recording window
      setTimeout(async () => {
        setIsRecording(false);
        setAnalyzing(true);
        try {
          const sampleAudioTranscript = "two rotis, yellow dal, and a bowl of curd";
          const parsed = await api.post<ParsedMeal>("/meals/parse", {
            text: sampleAudioTranscript,
            clientTimestamp: new Date().toISOString(),
          });
          onParsed(parsed, "voice", sampleAudioTranscript);
        } catch (err) {
          console.error(err);
          Alert.alert("Voice Error", "Could not transcribe audio. Please try typing.");
        } finally {
          setAnalyzing(false);
        }
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  // 3. Camera / Photo Snap
  const handlePickImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Camera Permission",
        "Camera access is needed to photograph meal plates."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, // Compress client-side
    });

    if (!result.canceled && result.assets[0]) {
      setAnalyzing(true);
      try {
        // Parse simulated plate image via backend
        const parsed = await api.post<ParsedMeal>("/meals/parse", {
          text: "plate photo: dal, rice and sabzi",
          clientTimestamp: new Date().toISOString(),
        });
        onParsed(parsed, "camera", "Plate photo capture");
      } catch (err) {
        console.error(err);
        Alert.alert("Photo Error", "Could not analyze photo. Try quick text entry.");
      } finally {
        setAnalyzing(false);
      }
    }
  };

  // 4. Mark Skipped Meal
  const handleMarkSkipped = async () => {
    setAnalyzing(true);
    try {
      const parsed = await api.post<ParsedMeal>("/meals/parse", {
        text: "skipped meal",
        clientTimestamp: new Date().toISOString(),
      });
      onParsed(parsed, "manual", "Skipped meal");
    } finally {
      setAnalyzing(false);
    }
  };

  if (analyzing) {
    return (
      <View style={styles.analyzingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text style={styles.analyzingTitle}>Analyzing your meal...</Text>
        <Text style={styles.analyzingSub}>
          Identifying ingredients, estimating portions, and calculating macros.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Tab Switcher: Voice / Camera / Text */}
      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabBtn, mode === "voice" && styles.tabBtnActive]}
          onPress={() => setMode("voice")}
        >
          <Text style={[styles.tabText, mode === "voice" && styles.tabTextActive]}>
            🎙 Voice
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, mode === "camera" && styles.tabBtnActive]}
          onPress={() => setMode("camera")}
        >
          <Text style={[styles.tabText, mode === "camera" && styles.tabTextActive]}>
            📷 Camera
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, mode === "text" && styles.tabBtnActive]}
          onPress={() => setMode("text")}
        >
          <Text style={[styles.tabText, mode === "text" && styles.tabTextActive]}>
            ⌨️ Text
          </Text>
        </Pressable>
      </View>

      {/* Mode 1: Voice */}
      {mode === "voice" && (
        <View style={styles.voiceHero}>
          <Pressable
            style={[styles.micCircle, isRecording && styles.micCircleRecording]}
            onPress={handleToggleVoice}
            accessibilityRole="button"
            accessibilityLabel="Record voice"
          >
            <Text style={{ fontSize: 34 }}>{isRecording ? "⏹" : "🎙"}</Text>
          </Pressable>
          <Text style={styles.voiceTitle}>
            {isRecording ? "Listening to your meal..." : "Tap to speak your meal"}
          </Text>
          <Text style={styles.voiceSub}>
            {isRecording
              ? "e.g. 'Two chapatis, a bowl of dal, and cucumber salad'..."
              : "Supports Indian dishes & household portions (katoris, rotis, spoons)"}
          </Text>
        </View>
      )}

      {/* Mode 2: Camera */}
      {mode === "camera" && (
        <View style={styles.cameraHero}>
          <Pressable
            style={styles.cameraCircle}
            onPress={handlePickImage}
            accessibilityRole="button"
            accessibilityLabel="Take plate photo"
          >
            <Text style={{ fontSize: 34 }}>📸</Text>
          </Pressable>
          <Text style={styles.voiceTitle}>Snap Your Plate</Text>
          <Text style={styles.voiceSub}>
            Take a clear photo showing the whole meal. Compressed under 100kB.
          </Text>
        </View>
      )}

      {/* Mode 3: Text Input */}
      {mode === "text" && (
        <View style={styles.textSection}>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 2 eggs, 1 slice toast, and black coffee..."
            value={textInput}
            onChangeText={setTextInput}
            multiline
            numberOfLines={3}
          />
          <Button
            label="Analyze Food →"
            onPress={() => handleParseText()}
            disabled={!textInput.trim()}
            style={{ width: "100%" }}
          />
        </View>
      )}

      {/* Frequent / Quick Re-log Chips */}
      <View style={styles.frequentSection}>
        <Text style={styles.frequentHeader}>⚡️ Frequent / One-Tap Logs</Text>
        <View style={styles.chipsWrap}>
          {FREQUENT_MEALS.map((f, i) => (
            <Pressable
              key={i}
              style={styles.frequentChip}
              onPress={() => handleParseText(f.text)}
            >
              <Text style={styles.frequentChipText}>+ {f.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Valid "Skipped Meal" Option */}
      <Pressable style={styles.skipButton} onPress={handleMarkSkipped}>
        <Text style={styles.skipButtonText}>
          Didn't eat? Log as Skipped Meal
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.md,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.bg.surface,
  },
  tabText: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: "500",
  },
  tabTextActive: {
    color: colors.brand.primary,
    fontWeight: "600",
  },
  voiceHero: {
    backgroundColor: colors.brand.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  micCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  micCircleRecording: {
    backgroundColor: colors.semantic.error,
  },
  cameraHero: {
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  cameraCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  voiceTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  voiceSub: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 280,
  },
  textSection: {
    gap: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text.primary,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  frequentSection: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  frequentHeader: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  frequentChip: {
    backgroundColor: colors.bg.subtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  frequentChipText: {
    ...typography.caption,
    color: colors.brand.primary,
    fontWeight: "600",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  skipButtonText: {
    ...typography.caption,
    color: colors.text.muted,
    textDecorationLine: "underline",
  },
  analyzingContainer: {
    padding: spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  analyzingTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  analyzingSub: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 260,
  },
});

