import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { lightImpact, successNotification } from "../../lib/haptics";
import { api } from "../../lib/api-client";
import type {
  ExtractedReportResponse,
  ExtractedParameter,
  SaveReportInput,
} from "@hale/shared";

interface ReportReviewContentProps {
  extractedReport: ExtractedReportResponse;
  onSaved: () => void;
  onCancel: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  normal: { bg: "#E8F5E9", text: "#2E7D32", label: "NORMAL" },
  low: { bg: "#FFF3E0", text: "#E65100", label: "LOW" },
  high: { bg: "#FFEBEE", text: "#C62828", label: "HIGH" },
  unknown: { bg: "#F5F5F5", text: "#616161", label: "UNKNOWN" },
};

export function ReportReviewContent({
  extractedReport,
  onSaved,
  onCancel,
}: ReportReviewContentProps) {
  const [reportDate, setReportDate] = useState(extractedReport.reportDate);
  const [labName, setLabName] = useState(extractedReport.labName || "Diagnostic Lab");
  const [parameters, setParameters] = useState<ExtractedParameter[]>(
    extractedReport.parameters
  );
  const [acceptedHabits, setAcceptedHabits] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const s of extractedReport.goalLinkedSuggestions) {
      initial[s.parameterKey] = true; // Auto-select recommended habits
    }
    return initial;
  });
  const [isSaving, setIsSaving] = useState(false);

  const toggleHabit = (key: string) => {
    lightImpact();
    setAcceptedHabits((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const removeParameter = (index: number) => {
    lightImpact();
    setParameters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      const acceptedKeys = Object.entries(acceptedHabits)
        .filter(([, selected]) => selected)
        .map(([k]) => k);

      const payload: SaveReportInput = {
        reportDate,
        label: labName,
        parameters,
        acceptedHabitKeys: acceptedKeys,
      };

      await api.post("/reports", payload);
      successNotification();
      onSaved();
    } catch (err) {
      console.error("Failed to save report:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Report Header Metadata Card */}
      <Card style={styles.metaCard}>
        <View style={styles.metaRow}>
          <View style={styles.metaInputGroup}>
            <Text style={styles.metaLabel}>REPORT DATE</Text>
            <TextInput
              style={styles.metaInput}
              value={reportDate}
              onChangeText={setReportDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={[styles.metaInputGroup, { flex: 1.5 }]}>
            <Text style={styles.metaLabel}>LAB / CLINIC</Text>
            <TextInput
              style={styles.metaInput}
              value={labName}
              onChangeText={setLabName}
              placeholder="Lab Name"
            />
          </View>
        </View>
      </Card>

      {/* Extracted Biomarkers Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>EXTRACTED BIOMARKERS</Text>
        <Text style={styles.paramCountBadge}>{parameters.length} found</Text>
      </View>

      <View style={styles.paramList}>
        {parameters.map((param, idx) => {
          const cfg = STATUS_COLORS[param.status] ?? STATUS_COLORS.normal!;
          const refRangeText =
            param.refLow != null && param.refHigh != null
              ? `Ref: ${param.refLow} - ${param.refHigh} ${param.unit}`
              : null;

          return (
            <View key={idx} style={styles.paramCard}>
              <View style={styles.paramTop}>
                <View style={styles.paramNameWrapper}>
                  <Text style={styles.paramName}>{param.name}</Text>
                  {refRangeText && (
                    <Text style={styles.refRangeText}>{refRangeText}</Text>
                  )}
                </View>

                <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.statusText, { color: cfg.text }]}>
                    {cfg.label}
                  </Text>
                </View>
              </View>

              <View style={styles.paramValueRow}>
                <Text style={styles.paramValue}>
                  {param.value}{" "}
                  <Text style={styles.paramUnit}>{param.unit}</Text>
                </Text>

                <Pressable
                  onPress={() => removeParameter(idx)}
                  style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
                  accessibilityLabel={`Remove ${param.name}`}
                >
                  <Text style={styles.deleteIcon}>✕</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      {/* Goal-Linked Habit Suggestions */}
      {extractedReport.goalLinkedSuggestions.length > 0 && (
        <View style={styles.habitsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>GOAL-LINKED HABIT SUGGESTIONS</Text>
            <Text style={styles.smartTag}>AI Generated</Text>
          </View>
          <Text style={styles.habitIntro}>
            Based on your flagged biomarkers, adopt these high-impact focus habits:
          </Text>

          <View style={styles.habitsList}>
            {extractedReport.goalLinkedSuggestions.map((sug) => {
              const isSelected = !!acceptedHabits[sug.parameterKey];

              return (
                <Pressable
                  key={sug.parameterKey}
                  style={[styles.habitCard, isSelected && styles.habitCardSelected]}
                  onPress={() => toggleHabit(sug.parameterKey)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  <View style={styles.habitCheckboxRow}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                    <View style={styles.habitTextGroup}>
                      <Text style={styles.habitTitle}>{sug.habitTitle}</Text>
                      <Text style={styles.habitWhy}>{sug.why}</Text>
                      <Text style={styles.habitMetric}>Target: {sug.metric}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Confirmation Actions */}
      <View style={styles.actionsRow}>
        <Button
          label="Cancel"
          variant="secondary"
          onPress={onCancel}
          style={styles.cancelBtn}
          disabled={isSaving}
        />
        <Button
          label={isSaving ? "Saving Report..." : "Confirm & Save Report"}
          loading={isSaving}
          disabled={isSaving || parameters.length === 0}
          onPress={handleConfirmSave}
          style={styles.saveBtn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing["4xl"],
  },
  metaCard: {
    backgroundColor: colors.bg.canvas,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metaInputGroup: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    ...typography.badge,
    color: colors.text.muted,
  },
  metaInput: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    ...typography.badge,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  paramCountBadge: {
    ...typography.badge,
    color: colors.brand.primary,
  },
  smartTag: {
    ...typography.badge,
    color: colors.brand.accent,
    fontWeight: "700",
  },
  paramList: {
    gap: spacing.sm,
  },
  paramCard: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  paramTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  paramNameWrapper: {
    flex: 1,
    gap: 2,
  },
  paramName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: "700",
  },
  refRangeText: {
    ...typography.badge,
    color: colors.text.muted,
  },
  statusPill: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusText: {
    ...typography.badge,
    fontWeight: "800",
    fontSize: 10,
  },
  paramValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  paramValue: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: "800",
  },
  paramUnit: {
    ...typography.caption,
    color: colors.text.muted,
    fontWeight: "400",
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  deleteIcon: {
    fontSize: 14,
    color: colors.text.muted,
  },
  habitsSection: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  habitIntro: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  habitsList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  habitCard: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  habitCardSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primaryLight,
  },
  habitCheckboxRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  checkMark: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: "800",
  },
  habitTextGroup: {
    flex: 1,
    gap: 2,
  },
  habitTitle: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: "700",
  },
  habitWhy: {
    ...typography.badge,
    color: colors.text.secondary,
    lineHeight: 15,
  },
  habitMetric: {
    ...typography.badge,
    color: colors.brand.accent,
    fontWeight: "700",
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
  },
});
