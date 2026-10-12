import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Alert } from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { ResponsiveSheet } from "../../ui/ResponsiveSheet";
import { Button } from "../../ui/Button";
import { IconBell, IconCheck } from "../../ui/icons";
import { lightImpact, successNotification } from "../../lib/haptics";
import {
  DEFAULT_MEAL_REMINDERS,
  sendTestNotification,
  requestNotificationPermissions,
} from "../../lib/notifications";
import type { MealRecord } from "@hale/shared";

interface MealRemindersModalProps {
  visible: boolean;
  onClose: () => void;
  meals: MealRecord[];
  currentStreakDays: number;
}

export function MealRemindersModal({
  visible,
  onClose,
  meals,
  currentStreakDays,
}: MealRemindersModalProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const hasBreakfast = meals.some((m) => m.mealType === "breakfast" && !m.isSkipped);
  const hasLunch = meals.some((m) => m.mealType === "lunch" && !m.isSkipped);
  const hasDinner = meals.some((m) => m.mealType === "dinner" && !m.isSkipped);
  const hasStreakSecured = meals.filter((m) => !m.isSkipped).length >= 2;

  const handleSendTest = async () => {
    lightImpact();
    setIsTesting(true);
    try {
      const granted = await requestNotificationPermissions();
      if (!granted && Platform.OS !== "web") {
        Alert.alert(
          "Notifications Permission",
          "Please enable notifications in device settings to receive timely meal reminders."
        );
        return;
      }

      const success = await sendTestNotification("lunch");
      if (success) {
        successNotification();
        setTestSent(true);
        setTimeout(() => setTestSent(false), 4000);
      } else if (Platform.OS === "web") {
        Alert.alert(
          "Web Notifications",
          "Push notifications are active on iOS & Android devices. Local reminders are safely simulated on web."
        );
      }
    } finally {
      setIsTesting(false);
    }
  };

  const getReminderStatus = (id: string, mealType: string) => {
    if (mealType === "breakfast" && hasBreakfast) return { cancelled: true, reason: "Logged ✓" };
    if (mealType === "lunch" && hasLunch) return { cancelled: true, reason: "Logged ✓" };
    if (mealType === "dinner" && hasDinner) return { cancelled: true, reason: "Logged ✓" };
    if (id === "meal-reminder-streak" && hasStreakSecured) return { cancelled: true, reason: "Streak secured ✓" };
    return { cancelled: false, reason: "Active Nudge" };
  };

  return (
    <ResponsiveSheet visible={visible} onClose={onClose} title="Smart Meal Reminders">
      <View style={styles.container}>
        {/* Intro banner */}
        <View style={styles.infoBanner}>
          <IconBell size={20} color={colors.brand.primary} strokeWidth={2.2} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Non-nagging gentle nudges</Text>
            <Text style={styles.infoDescription}>
              Hale schedules local notifications on your device. When you log a meal, its reminder automatically cancels.
            </Text>
          </View>
        </View>

        {/* Schedule list */}
        <Text style={styles.sectionHeader}>TODAY'S REMINDER SCHEDULE</Text>
        <View style={styles.scheduleList}>
          {DEFAULT_MEAL_REMINDERS.map((reminder) => {
            const status = getReminderStatus(reminder.id, reminder.mealType);

            return (
              <View key={reminder.id} style={styles.scheduleRow}>
                <View style={styles.scheduleLeft}>
                  <Text style={styles.scheduleTitle}>{reminder.title}</Text>
                  <Text style={styles.scheduleTime}>Scheduled for {reminder.scheduledTime}</Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    status.cancelled ? styles.statusPillCancelled : styles.statusPillActive,
                  ]}
                >
                  {status.cancelled && (
                    <IconCheck size={12} color={colors.semantic.success} strokeWidth={2.4} />
                  )}
                  <Text
                    style={[
                      styles.statusPillText,
                      status.cancelled
                        ? styles.statusPillTextCancelled
                        : styles.statusPillTextActive,
                    ]}
                  >
                    {status.reason}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Feedback message when test notification sent */}
        {testSent && (
          <View style={styles.testSuccessBox}>
            <Text style={styles.testSuccessText}>
              ✓ Test notification dispatched! Look at your notification banner in 2 seconds.
            </Text>
          </View>
        )}

        {/* Test Trigger Button */}
        <Button
          label={isTesting ? "Triggering..." : "Send Test Notification Now"}
          onPress={handleSendTest}
          loading={isTesting}
          style={styles.testButton}
        />
      </View>
    </ResponsiveSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.brand.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  infoTextContainer: {
    flex: 1,
    gap: 2,
  },
  infoTitle: {
    ...typography.bodyMedium,
    color: colors.brand.primary,
    fontWeight: "700",
  },
  infoDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  sectionHeader: {
    ...typography.badge,
    color: colors.text.muted,
    letterSpacing: 0.8,
  },
  scheduleList: {
    backgroundColor: colors.bg.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: "hidden",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  scheduleLeft: {
    flex: 1,
  },
  scheduleTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: "600",
  },
  scheduleTime: {
    ...typography.badge,
    color: colors.text.muted,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusPillCancelled: {
    backgroundColor: colors.semantic.successLight,
  },
  statusPillActive: {
    backgroundColor: "rgba(224, 122, 95, 0.12)",
  },
  statusPillText: {
    ...typography.badge,
    fontWeight: "600",
  },
  statusPillTextCancelled: {
    color: colors.semantic.success,
  },
  statusPillTextActive: {
    color: colors.brand.accent,
  },
  testSuccessBox: {
    backgroundColor: colors.semantic.successLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(45, 106, 79, 0.2)",
  },
  testSuccessText: {
    ...typography.caption,
    color: colors.semantic.success,
    fontWeight: "600",
    textAlign: "center",
  },
  testButton: {
    marginTop: spacing.xs,
  },
});

