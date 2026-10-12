import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { lightImpact, mediumImpact } from "../../lib/haptics";
import type { ReportItem } from "./ReportCard";

interface ReportDetailSheetProps {
  report: ReportItem;
  onClose: () => void;
  onDelete: (reportId: string) => Promise<void>;
}

export function ReportDetailSheet({
  report,
  onClose,
  onDelete,
}: ReportDetailSheetProps) {
  const [filter, setFilter] = useState<"all" | "flagged" | "in_range">("all");
  const [isDeleting, setIsDeleting] = useState(false);

  const parameters = report.parameters ?? [];
  const flagged = parameters.filter((p) => p.status === "low" || p.status === "high");
  const inRange = parameters.filter((p) => p.status === "normal");

  const filteredParams =
    filter === "flagged"
      ? flagged
      : filter === "in_range"
      ? inRange
      : parameters;

  const handleDeletePrompt = () => {
    mediumImpact();
    Alert.alert(
      "Delete Lab Report?",
      "This will permanently remove this diagnostic report, all its biomarker measurements, and any associated context from your health profile.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Report",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await onDelete(report.id);
            } catch (err) {
              console.error("Failed to delete report:", err);
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Could not delete report."
              );
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Report Info Banner */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <Text style={styles.labName}>{report.label}</Text>
            <Text style={styles.reportDate}>Report Date: {report.reportDate}</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{report.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Counts summary strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{parameters.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: colors.semantic.success }]}>
              {inRange.length}
            </Text>
            <Text style={styles.statLabel}>In Range</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text
              style={[
                styles.statNum,
                { color: flagged.length > 0 ? colors.brand.accent : colors.text.muted },
              ]}
            >
              {flagged.length}
            </Text>
            <Text style={styles.statLabel}>Flagged</Text>
          </View>
        </View>
      </Card>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterChip, filter === "all" && styles.filterChipActive]}
          onPress={() => {
            lightImpact();
            setFilter("all");
          }}
        >
          <Text
            style={[
              styles.filterChipText,
              filter === "all" && styles.filterChipTextActive,
            ]}
          >
            All ({parameters.length})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterChip,
            filter === "flagged" && styles.filterChipActive,
            flagged.length > 0 && styles.flaggedChipBorder,
          ]}
          onPress={() => {
            lightImpact();
            setFilter("flagged");
          }}
        >
          <Text
            style={[
              styles.filterChipText,
              filter === "flagged" && styles.filterChipTextActive,
              filter !== "flagged" && flagged.length > 0 && { color: colors.brand.accent },
            ]}
          >
            ⚠️ Flagged ({flagged.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === "in_range" && styles.filterChipActive]}
          onPress={() => {
            lightImpact();
            setFilter("in_range");
          }}
        >
          <Text
            style={[
              styles.filterChipText,
              filter === "in_range" && styles.filterChipTextActive,
            ]}
          >
            ✓ In Range ({inRange.length})
          </Text>
        </Pressable>
      </View>

      {/* Biomarker List */}
      <View style={styles.biomarkerList}>
        {filteredParams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filter === "flagged"
                ? "🎉 Great news! No flagged biomarkers in this report."
                : "No biomarkers matching this filter."}
            </Text>
          </View>
        ) : (
          filteredParams.map((p) => {
            const isFlagged = p.status === "high" || p.status === "low";
            const statusLabel =
              p.status === "high"
                ? "ELEVATED"
                : p.status === "low"
                ? "BELOW RANGE"
                : "IN RANGE";

            return (
              <Card key={p.id} style={styles.paramCard}>
                <View style={styles.paramTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paramName}>{p.name}</Text>
                    <Text style={styles.paramRef}>
                      {p.refLow != null && p.refHigh != null
                        ? `Target: ${p.refLow} – ${p.refHigh} ${p.unit}`
                        : p.refLow != null
                        ? `Target: > ${p.refLow} ${p.unit}`
                        : p.refHigh != null
                        ? `Target: < ${p.refHigh} ${p.unit}`
                        : "Standard Range"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.paramStatusBadge,
                      isFlagged
                        ? styles.paramStatusFlagged
                        : styles.paramStatusNormal,
                    ]}
                  >
                    <Text
                      style={[
                        styles.paramStatusText,
                        isFlagged
                          ? styles.paramStatusTextFlagged
                          : styles.paramStatusTextNormal,
                      ]}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                <View style={styles.paramValueRow}>
                  <Text style={styles.paramValue}>{p.value}</Text>
                  <Text style={styles.paramUnit}>{p.unit}</Text>
                </View>
              </Card>
            );
          })
        )}
      </View>

      {/* Danger Zone: Delete Report */}
      <View style={styles.dangerZone}>
        <Button
          label={isDeleting ? "Deleting Report..." : "🗑️ Delete Report & Purge Context"}
          variant="secondary"
          onPress={handleDeletePrompt}
          disabled={isDeleting}
          loading={isDeleting}
          style={styles.deleteBtn}
          textStyle={{ color: colors.semantic.error }}
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
  headerCard: {
    backgroundColor: colors.bg.surface,
    gap: spacing.sm,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  labName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  reportDate: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statusPill: {
    backgroundColor: colors.brand.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusPillText: {
    ...typography.badge,
    color: colors.brand.primary,
  },
  statsStrip: {
    flexDirection: "row",
    backgroundColor: colors.bg.subtle,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
    alignItems: "center",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    ...typography.h3,
    fontWeight: "700",
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.subtle,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  filterChip: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: "center",
    backgroundColor: colors.bg.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  filterChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  flaggedChipBorder: {
    borderColor: "rgba(224, 122, 95, 0.4)",
  },
  filterChipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: colors.text.inverse,
    fontWeight: "600",
  },
  biomarkerList: {
    gap: spacing.xs,
  },
  emptyContainer: {
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
  },
  paramCard: {
    backgroundColor: colors.bg.surface,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  paramTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  paramName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: "600",
  },
  paramRef: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  paramStatusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  paramStatusNormal: {
    backgroundColor: "#E8F5E9",
  },
  paramStatusFlagged: {
    backgroundColor: "#FFEBEE",
  },
  paramStatusText: {
    ...typography.badge,
    fontSize: 10,
  },
  paramStatusTextNormal: {
    color: "#2E7D32",
  },
  paramStatusTextFlagged: {
    color: "#C62828",
  },
  paramValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  paramValue: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text.primary,
  },
  paramUnit: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  dangerZone: {
    marginTop: spacing.md,
  },
  deleteBtn: {
    borderColor: "rgba(220, 38, 38, 0.25)",
    backgroundColor: "rgba(220, 38, 38, 0.05)",
  },
});

