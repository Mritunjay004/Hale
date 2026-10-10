import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { ResponsiveSheet } from "../../ui/ResponsiveSheet";
import type { StreakSummary } from "@hale/shared";

interface StreakBadgeModalProps {
  visible: boolean;
  onClose: () => void;
  streak: StreakSummary;
  mealsCount: number;
}

interface BadgeItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progressText?: string;
}

export function StreakBadgeModal({
  visible,
  onClose,
  streak,
  mealsCount,
}: StreakBadgeModalProps) {
  const badges: BadgeItem[] = [
    {
      id: "first_step",
      icon: "🌱",
      title: "First Step",
      description: "Logged your first meal in Hale.",
      unlocked: mealsCount > 0,
      progressText: mealsCount > 0 ? "Unlocked" : "Log 1 meal",
    },
    {
      id: "three_streak",
      icon: "🔥",
      title: "Three in a Row",
      description: "Maintained a 3-day logging streak.",
      unlocked: streak.currentStreakDays >= 3,
      progressText:
        streak.currentStreakDays >= 3
          ? "Unlocked"
          : `${streak.currentStreakDays}/3 days`,
    },
    {
      id: "seven_streak",
      icon: "⚡",
      title: "7-Day Warrior",
      description: "Consistent logging for a full calendar week.",
      unlocked: streak.currentStreakDays >= 7,
      progressText:
        streak.currentStreakDays >= 7
          ? "Unlocked"
          : `${streak.currentStreakDays}/7 days`,
    },
    {
      id: "protein_champ",
      icon: "💪",
      title: "Protein Champion",
      description: "Hit your daily protein target consistently.",
      unlocked: mealsCount >= 4,
      progressText: mealsCount >= 4 ? "Unlocked" : "Hit protein target 5 days",
    },
    {
      id: "lab_explorer",
      icon: "🧪",
      title: "Lab Explorer",
      description: "Uploaded a lab test to connect biomarkers to diet.",
      unlocked: false,
      progressText: "Upload lab report",
    },
    {
      id: "mindful_eater",
      icon: "🧘",
      title: "Mindful Eater",
      description: "Logged timely meals without skipping 7 days.",
      unlocked: streak.currentStreakDays >= 7,
      progressText: "7 days timely logging",
    },
  ];

  return (
    <ResponsiveSheet visible={visible} onClose={onClose} title="Streak & Achievements">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Streak Highlight Card */}
        <View style={styles.streakCard}>
          <Text style={styles.flameEmoji}>🔥</Text>
          <Text style={styles.streakBigNumber}>{streak.currentStreakDays} Days</Text>
          <Text style={styles.streakSub}>
            {streak.currentStreakDays === 1
              ? "Every journey starts with Day 1. Keep going!"
              : "Consistency compounds. You're building a lasting habit!"}
          </Text>

          <View style={styles.gracePill}>
            <Text style={styles.graceText}>
              🛡️ {streak.hasGraceDayUsedThisWeek ? "Grace day used this week" : "1 Grace day active this week"}
            </Text>
          </View>
        </View>

        {/* Milestone Badges Header */}
        <View style={styles.badgeSectionHeader}>
          <Text style={styles.badgeSectionTitle}>MILESTONE BADGES</Text>
          <Text style={styles.unlockedCount}>
            {badges.filter((b) => b.unlocked).length}/{badges.length} Unlocked
          </Text>
        </View>

        {/* Badges Grid */}
        <View style={styles.badgesGrid}>
          {badges.map((badge) => (
            <View
              key={badge.id}
              style={[styles.badgeCard, badge.unlocked ? styles.badgeUnlocked : styles.badgeLocked]}
            >
              <View style={styles.badgeIconWrapper}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                {badge.unlocked && <Text style={styles.checkIcon}>✓</Text>}
              </View>
              <Text style={styles.badgeTitle}>{badge.title}</Text>
              <Text style={styles.badgeDesc}>{badge.description}</Text>
              <Text
                style={[
                  styles.badgeProgress,
                  badge.unlocked && styles.badgeProgressUnlocked,
                ]}
              >
                {badge.progressText}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ResponsiveSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing["3xl"],
  },
  streakCard: {
    backgroundColor: colors.brand.primaryLight,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: "center",
    gap: spacing.xs,
  },
  flameEmoji: {
    fontSize: 40,
  },
  streakBigNumber: {
    ...typography.h1,
    color: colors.brand.primary,
    fontWeight: "800",
  },
  streakSub: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 280,
  },
  gracePill: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  graceText: {
    ...typography.badge,
    color: colors.brand.primary,
    fontWeight: "600",
  },
  badgeSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  badgeSectionTitle: {
    ...typography.badge,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  unlockedCount: {
    ...typography.badge,
    color: colors.brand.primary,
    fontWeight: "700",
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  badgeCard: {
    width: "48%",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xxs,
  },
  badgeUnlocked: {
    backgroundColor: colors.bg.surface,
    borderColor: "#B7E4C7",
  },
  badgeLocked: {
    backgroundColor: colors.bg.canvas,
    borderColor: colors.border.subtle,
    opacity: 0.7,
  },
  badgeIconWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  badgeIcon: {
    fontSize: 28,
  },
  checkIcon: {
    fontSize: 14,
    color: colors.semantic.success,
    fontWeight: "800",
  },
  badgeTitle: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: "700",
  },
  badgeDesc: {
    ...typography.badge,
    color: colors.text.secondary,
    lineHeight: 14,
  },
  badgeProgress: {
    ...typography.badge,
    color: colors.text.muted,
    marginTop: 4,
    fontWeight: "600",
  },
  badgeProgressUnlocked: {
    color: colors.semantic.success,
  },
});

