import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { api } from "../../lib/api-client";
import { lightImpact } from "../../lib/haptics";
import type { ExtractedReportResponse } from "@hale/shared";

interface ReportUploadSheetProps {
  onExtracted: (data: ExtractedReportResponse) => void;
  onClose: () => void;
}

export function ReportUploadSheet({ onExtracted, onClose }: ReportUploadSheetProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatusText, setExtractStatusText] = useState("");

  const handleExtractWithSample = async () => {
    lightImpact();
    setIsExtracting(true);
    setExtractStatusText("Extracting biomarkers from comprehensive panel...");
    try {
      const result = await api.post<ExtractedReportResponse>("/reports/extract", {});
      onExtracted(result);
    } catch (err) {
      console.error("Failed to extract report:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePickImage = async (useCamera: boolean) => {
    lightImpact();
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          alert("Camera permission is needed to scan paper reports.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,
          quality: 0.6,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Photos permission is needed to select report images.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,
          quality: 0.6,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setIsExtracting(true);
        setExtractStatusText("Analyzing document & extracting biomarkers...");
        const extracted = await api.post<ExtractedReportResponse>("/reports/extract", {
          base64: asset.base64,
          mimeType: asset.mimeType || "image/jpeg",
        });
        onExtracted(extracted);
      }
    } catch (err) {
      console.error("Failed to capture image:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  if (isExtracting) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>🔬</Text>
        <Text style={styles.loadingTitle}>Extracting Biomarkers</Text>
        <Text style={styles.loadingSub}>{extractStatusText}</Text>
        <Text style={styles.privacyNote}>
          🔒 Privacy Notice: Raw medical images are processed in memory and never stored on servers.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Upload any blood test, lipid panel, or metabolic lab report. Hale extracts your biomarkers and connects them to actionable daily diet habits.
      </Text>

      {/* Upload Option Cards */}
      <View style={styles.optionsList}>
        <Pressable
          style={({ pressed }) => [styles.optionCard, pressed && { opacity: 0.85 }]}
          onPress={() => handlePickImage(true)}
          accessibilityRole="button"
          accessibilityLabel="Take Photo with Camera"
        >
          <Text style={styles.optionEmoji}>📷</Text>
          <View style={styles.optionTextGroup}>
            <Text style={styles.optionTitle}>Scan with Camera</Text>
            <Text style={styles.optionDesc}>Photograph paper lab report</Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.optionCard, pressed && { opacity: 0.85 }]}
          onPress={() => handlePickImage(false)}
          accessibilityRole="button"
          accessibilityLabel="Choose from Photo Library"
        >
          <Text style={styles.optionEmoji}>🖼️</Text>
          <View style={styles.optionTextGroup}>
            <Text style={styles.optionTitle}>Photo Library / Document</Text>
            <Text style={styles.optionDesc}>Upload report image or screenshot</Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.optionCard,
            styles.sampleOptionCard,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleExtractWithSample}
          accessibilityRole="button"
          accessibilityLabel="Try with Sample Comprehensive Blood Panel"
        >
          <Text style={styles.optionEmoji}>🧪</Text>
          <View style={styles.optionTextGroup}>
            <Text style={styles.sampleOptionTitle}>Try with Sample Blood Panel</Text>
            <Text style={styles.optionDesc}>
              Instant reviewer demo: extracts Vitamin D, LDL, Glucose, HbA1c
            </Text>
          </View>
        </Pressable>
      </View>

      <Text style={styles.privacyDisclaimer}>
        🔒 Hale processes documents strictly in-memory. No raw images or PDFs are stored server-side.
      </Text>

      <Button label="Close" variant="secondary" onPress={onClose} style={{ marginTop: spacing.xs }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.md,
  },
  sampleOptionCard: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primaryLight,
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionTextGroup: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: "700",
  },
  sampleOptionTitle: {
    ...typography.bodyMedium,
    color: colors.brand.primary,
    fontWeight: "700",
  },
  optionDesc: {
    ...typography.badge,
    color: colors.text.secondary,
  },
  privacyDisclaimer: {
    ...typography.badge,
    color: colors.text.muted,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 14,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  loadingTitle: {
    ...typography.h2,
    color: colors.brand.primary,
  },
  loadingSub: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 280,
  },
  privacyNote: {
    ...typography.badge,
    color: colors.text.muted,
    textAlign: "center",
    marginTop: spacing.md,
    fontSize: 10,
    maxWidth: 260,
  },
});

