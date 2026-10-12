import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { Card } from "../../ui/Card";

export interface ReportItem {
  id: string;
  reportDate: string;
  label: string;
  status: string;
  createdAt: string;
  parameters?: Array<{
    id: string;
    canonicalKey: string | null;
    name: string;
    value: number;
    unit: string;
    refLow?: number | null;
    refHigh?: number | null;
    status: "low" | "normal" | "high" | "unknown";
  }>;
}

interface ReportCardProps {
  report: ReportItem;
  onPress?: () => void;
}

export function ReportCard({ report, onPress }: ReportCardProps) {
  const params = report.parameters ?? [];
  const normalCount = params.filter((p) => p.status === "normal").length;
  const flaggedCount = params.filter((p) => p.status === "low" || p.status === "high").length;

  return (
    <Card style={styles.card}>
      <Pressable onPress={onPress} style={styles.pressable}>
        <View style={styles.topRow}>
          <View style={styles.iconDateGroup}>
            <Text style={styles.docIcon}>📄</Text>
            <View>
              <Text style={styles.label}>{report.label}</Text>
              <Text style={styles.date}>{report.reportDate}</Text>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{report.status.toUpperCase()}</Text>
          </View>
        </View>

        {params.length > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryCount}>{params.length}</Text>
              <Text style={styles.summaryLabel}>Biomarkers</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryCount, styles.normalCount]}>{normalCount}</Text>
              <Text style={styles.summaryLabel}>In Range</Text>
            </View>

            {flaggedCount > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryCount, styles.flaggedCount]}>{flaggedCount}</Text>
                  <Text style={styles.summaryLabel}>Flagged</Text>
                </View>
              </>
            )}
          </View>
        )}
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    padding: spacing.md,
  },
  pressable: {
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconDateGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  docIcon: {
    fontSize: 24,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: "700",
  },
  date: {
    ...typography.badge,
    color: colors.text.muted,
  },
  statusBadge: {
    backgroundColor: colors.brand.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.badge,
    color: colors.brand.primary,
    fontWeight: "700",
    fontSize: 10,
  },
  summaryRow: {
    flexDirection: "row",
    backgroundColor: colors.bg.canvas,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryCount: {
    ...typography.caption,
    fontWeight: "800",
    color: colors.text.primary,
  },
  normalCount: {
    color: colors.semantic.success,
  },
  flaggedCount: {
    color: colors.semantic.warn,
  },
  summaryLabel: {
    ...typography.badge,
    color: colors.text.muted,
    fontSize: 9,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border.subtle,
  },
});

