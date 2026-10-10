import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../src/lib/api-client";
import { colors, spacing, radius, typography } from "../../src/theme/tokens";
import { Card } from "../../src/ui/Card";
import { Button } from "../../src/ui/Button";
import { Skeleton } from "../../src/ui/Skeleton";
import { ResponsiveSheet } from "../../src/ui/ResponsiveSheet";
import {
  ReportCard,
  ReportUploadSheet,
  ReportReviewContent,
  BiomarkerTrendCard,
  type ReportItem,
} from "../../src/features/reports";
import { lightImpact } from "../../src/lib/haptics";
import type {
  ExtractedReportResponse,
  ParameterTrendResponse,
} from "@hale/shared";

const TOP_BIOMARKERS = [
  { key: "vitamin_d", label: "Vitamin D", emoji: "☀️" },
  { key: "hba1c", label: "HbA1c", emoji: "🩸" },
  { key: "ldl_cholesterol", label: "LDL Cholesterol", emoji: "🫀" },
  { key: "fasting_glucose", label: "Fasting Glucose", emoji: "⚡" },
];

export default function ReportsScreen() {
  const queryClient = useQueryClient();
  const [selectedBiomarkerKey, setSelectedBiomarkerKey] = useState("vitamin_d");
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [extractedReport, setExtractedReport] = useState<ExtractedReportResponse | null>(null);

  // 1. Fetch all reports
  const {
    data: reports,
    isLoading: isLoadingReports,
    isRefetching,
    refetch,
  } = useQuery<ReportItem[]>({
    queryKey: ["reports"],
    queryFn: () => api.get<ReportItem[]>("/reports"),
  });

  // 2. Fetch trend for selected biomarker
  const {
    data: trendData,
    isLoading: isLoadingTrend,
  } = useQuery<ParameterTrendResponse>({
    queryKey: ["parameterTrend", selectedBiomarkerKey],
    queryFn: () => api.get<ParameterTrendResponse>(`/parameters/${selectedBiomarkerKey}/trend`),
    enabled: !!selectedBiomarkerKey,
  });

  const handleOpenUpload = () => {
    lightImpact();
    setExtractedReport(null);
    setUploadSheetVisible(true);
  };

  const handleCloseUpload = () => {
    setUploadSheetVisible(false);
    setExtractedReport(null);
  };

  const handleReportSaved = () => {
    handleCloseUpload();
    queryClient.invalidateQueries({ queryKey: ["reports"] });
    queryClient.invalidateQueries({ queryKey: ["parameterTrend"] });
    queryClient.invalidateQueries({ queryKey: ["today"] });
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.brand.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitles}>
            <Text style={styles.badgeLabel}>BIOMARKER ENGINE</Text>
            <Text style={styles.title}>Health Reports</Text>
            <Text style={styles.subtitle}>
              Turn lab values into actionable daily nutrition and vitality habits.
            </Text>
          </View>

          <Button
            label="+ Upload Report"
            onPress={handleOpenUpload}
            style={styles.uploadBtn}
          />
        </View>

        {/* Biomarkers Trend Selector */}
        <View style={styles.trendSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>BIOMARKER TRENDS</Text>
            <Text style={styles.trendHint}>Select a marker</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {TOP_BIOMARKERS.map((bio) => {
              const isSelected = selectedBiomarkerKey === bio.key;
              return (
                <Pressable
                  key={bio.key}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => {
                    lightImpact();
                    setSelectedBiomarkerKey(bio.key);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={styles.chipEmoji}>{bio.emoji}</Text>
                  <Text
                    style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}
                  >
                    {bio.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Active Biomarker Trend Card */}
          {isLoadingTrend ? (
            <Card style={styles.loadingCard}>
              <Skeleton width={140} height={20} />
              <Skeleton width="100%" height={14} style={{ marginTop: spacing.xs }} />
              <Skeleton width="100%" height={40} style={{ marginTop: spacing.sm }} />
            </Card>
          ) : trendData ? (
            <BiomarkerTrendCard trend={trendData} />
          ) : null}
        </View>

        {/* Uploaded Reports Section */}
        <View style={styles.reportsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>UPLOADED LAB REPORTS</Text>
            <Text style={styles.reportCount}>
              {reports?.length ?? 0} {reports?.length === 1 ? "report" : "reports"}
            </Text>
          </View>

          {isLoadingReports ? (
            <View style={styles.loadingList}>
              <Skeleton width="100%" height={100} borderRadius={radius.md} />
              <Skeleton width="100%" height={100} borderRadius={radius.md} />
            </View>
          ) : reports && reports.length > 0 ? (
            <View style={styles.reportsList}>
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </View>
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>No health reports yet</Text>
              <Text style={styles.emptySub}>
                Upload a blood test or lipid panel photo to connect blood markers directly to daily diet habits.
              </Text>
              <Button
                label="+ Upload First Report"
                onPress={handleOpenUpload}
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Upload & Review ResponsiveSheet */}
      <ResponsiveSheet
        visible={uploadSheetVisible}
        onClose={handleCloseUpload}
        title={extractedReport ? "Review Lab Biomarkers" : "Upload Lab Report"}
      >
        {extractedReport ? (
          <ReportReviewContent
            extractedReport={extractedReport}
            onSaved={handleReportSaved}
            onCancel={handleCloseUpload}
          />
        ) : (
          <ReportUploadSheet
            onExtracted={(data) => setExtractedReport(data)}
            onClose={handleCloseUpload}
          />
        )}
      </ResponsiveSheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  header: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  headerTitles: {
    gap: 2,
  },
  badgeLabel: {
    ...typography.badge,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
    maxWidth: 320,
  },
  uploadBtn: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  trendSection: {
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    ...typography.badge,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  trendHint: {
    ...typography.badge,
    color: colors.brand.primary,
  },
  chipsScroll: {
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  chipLabelSelected: {
    color: colors.text.inverse,
  },
  loadingCard: {
    padding: spacing.md,
    backgroundColor: colors.bg.surface,
  },
  reportsSection: {
    gap: spacing.sm,
  },
  reportCount: {
    ...typography.badge,
    color: colors.text.muted,
  },
  loadingList: {
    gap: spacing.sm,
  },
  reportsList: {
    gap: spacing.sm,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.xs,
    backgroundColor: colors.bg.surface,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  emptySub: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 280,
  },
});
