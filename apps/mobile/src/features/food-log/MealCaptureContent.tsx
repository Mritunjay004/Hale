import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { api } from "../../lib/api-client";
import { lightImpact, mediumImpact, successNotification } from "../../lib/haptics";
import { useMealCaptureStore } from "./useMealCaptureStore";
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
  const suggestedMealType = useMealCaptureStore((s) => s.suggestedMealType);
  const [mode, setMode] = useState<"voice" | "camera" | "text">("voice");
  const [textInput, setTextInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingMessage, setAnalyzingMessage] = useState("Analyzing your meal...");

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up recording and timers if sheet unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  // 1. Text Parse Action
  const handleParseText = async (customText?: string) => {
    const query = customText ?? textInput.trim();
    if (!query) return;

    setAnalyzingMessage("Analyzing your meal...");
    setAnalyzing(true);
    try {
      const parsed = await api.post<ParsedMeal>("/meals/parse", {
        text: query,
        mealType: suggestedMealType as any,
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

  // 2. Real Microphone Voice Recording with User Controlled Stop
  const startRecording = async () => {
    try {
      lightImpact();
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone Permission",
          "Microphone access is required to speak your meal."
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      Alert.alert("Recording Error", "Could not initialize microphone. Please try typing.");
    }
  };

  const stopRecordingAndTranscribe = async () => {
    if (!recordingRef.current) return;
    mediumImpact();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const recording = recordingRef.current;
    recordingRef.current = null;
    setIsRecording(false);

    setAnalyzingMessage("Transcribing your speech...");
    setAnalyzing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) {
        throw new Error("No recording URI found");
      }

      setAnalyzingMessage("Identifying ingredients & portions...");

      const formData = new FormData();
      if (Platform.OS === "web") {
        const audioBlob = await (await fetch(uri)).blob();
        formData.append("file", audioBlob, "recording.m4a");
      } else {
        formData.append("file", {
          uri,
          name: "recording.m4a",
          type: "audio/m4a",
        } as unknown as Blob);
      }

      if (suggestedMealType) {
        formData.append("suggestedMealType", suggestedMealType);
      }

      const result = await api.uploadFormData<{
        transcription: string;
        meal: ParsedMeal;
      }>("/meals/parse-audio", formData);

      successNotification();

      if (!result.meal.isFood) {
        Alert.alert(
          "Not Recognized as Food",
          result.meal.clarifyingQuestion ?? `Heard: "${result.transcription}"\nPlease describe food items.`
        );
        return;
      }

      onParsed(result.meal, "voice", result.transcription);
    } catch (err) {
      console.error("Voice transcription failed:", err);
      Alert.alert(
        "Voice Processing Failed",
        "Could not transcribe audio. You can type your meal or try speaking again."
      );
    } finally {
      setAnalyzing(false);
      setRecordSeconds(0);
    }
  };

  const handleToggleVoice = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      await stopRecordingAndTranscribe();
    }
  };

  // 3. Camera Snap & Photo Library
  const processImageUri = async (uri: string, mimeType?: string) => {
    setAnalyzingMessage("Analyzing plate photo with AI...");
    setAnalyzing(true);
    try {
      const formData = new FormData();
      if (Platform.OS === "web") {
        const imgBlob = await (await fetch(uri)).blob();
        formData.append("file", imgBlob, "plate.jpg");
      } else {
        formData.append("file", {
          uri,
          name: "plate.jpg",
          type: mimeType || "image/jpeg",
        } as unknown as Blob);
      }

      if (suggestedMealType) {
        formData.append("suggestedMealType", suggestedMealType);
      }

      const parsed = await api.uploadFormData<ParsedMeal>("/meals/parse-image", formData);

      if (!parsed.isFood || !parsed.items || parsed.items.length === 0) {
        Alert.alert(
          "Unable to Identify Food",
          parsed.clarifyingQuestion ??
            "We couldn't clearly identify the items in this photo. Please describe what you ate or snap another photo with better lighting."
        );
        return;
      }

      onParsed(parsed, "camera", "Plate photo capture");
    } catch (err: any) {
      console.error("Photo analysis error:", err);
      Alert.alert(
        "Photo Error",
        err?.message || "Could not analyze photo. Please describe your meal using text or voice."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePickImage = async () => {
    try {
      lightImpact();
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Camera Permission Needed",
          "Camera access is needed to photograph meal plates. Please enable it in Settings."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processImageUri(result.assets[0].uri, result.assets[0].mimeType);
      }
    } catch (err: any) {
      console.error("Camera launch error:", err);
      Alert.alert("Camera Error", err?.message || "Unable to open camera. You can choose from your gallery or type your meal.");
    }
  };

  const handlePickFromGallery = async () => {
    try {
      lightImpact();
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Photos Permission Needed",
          "Photos access is needed to select food images. Please enable it in Settings."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processImageUri(result.assets[0].uri, result.assets[0].mimeType);
      }
    } catch (err: any) {
      console.error("Gallery launch error:", err);
      Alert.alert("Gallery Error", err?.message || "Unable to open photo gallery.");
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
        <Text style={styles.analyzingTitle}>{analyzingMessage}</Text>
        <Text style={styles.analyzingSub}>
          Identifying ingredients, estimating portions, and calculating macros with AI.
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
            accessibilityLabel={isRecording ? "Stop recording and finish" : "Record voice"}
          >
            <Text style={{ fontSize: 34 }}>{isRecording ? "⏹" : "🎙"}</Text>
          </Pressable>
          <Text style={styles.voiceTitle}>
            {isRecording ? `Listening... (${recordSeconds}s)` : "Tap to speak your meal"}
          </Text>
          <Text style={styles.voiceSub}>
            {isRecording
              ? "Speak freely. When you're done, tap the button or 'Done Speaking' below."
              : "Supports Indian dishes & household portions (katoris, rotis, spoons)"}
          </Text>

          {isRecording && (
            <Pressable
              style={styles.doneSpeakingBtn}
              onPress={handleToggleVoice}
              accessibilityRole="button"
              accessibilityLabel="Done Speaking"
            >
              <Text style={styles.doneSpeakingText}>✓ Done Speaking</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Mode 2: Camera & Gallery */}
      {mode === "camera" && (
        <View style={styles.cameraHero}>
          <View style={styles.cameraButtonsRow}>
            <Pressable
              style={({ pressed }) => [styles.cameraCircle, pressed && { opacity: 0.85 }]}
              onPress={handlePickImage}
              accessibilityRole="button"
              accessibilityLabel="Take plate photo with camera"
            >
              <Text style={{ fontSize: 32 }}>📸</Text>
              <Text style={styles.cameraCircleLabel}>Camera</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.galleryCircle, pressed && { opacity: 0.85 }]}
              onPress={handlePickFromGallery}
              accessibilityRole="button"
              accessibilityLabel="Choose plate photo from gallery"
            >
              <Text style={{ fontSize: 32 }}>🖼️</Text>
              <Text style={styles.galleryCircleLabel}>Gallery</Text>
            </Pressable>
          </View>

          <Text style={styles.voiceTitle}>Photo Food Recognition</Text>
          <Text style={styles.voiceSub}>
            Snap your plate or pick from photos. Hale estimates portions & macros automatically.
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
  doneSpeakingBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: "center",
  },
  doneSpeakingText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: "700",
    fontSize: 14,
  },
  cameraHero: {
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  cameraButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
    marginBottom: spacing.xs,
  },
  cameraCircle: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  cameraCircleLabel: {
    ...typography.badge,
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: "700",
  },
  galleryCircle: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    backgroundColor: colors.bg.surface,
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  galleryCircleLabel: {
    ...typography.badge,
    color: colors.brand.primary,
    fontSize: 10,
    fontWeight: "700",
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

