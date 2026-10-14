import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { MealRecord } from "@hale/shared";

// Configure how notifications appear when app is foregrounded
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export type MealSlotType = "breakfast" | "lunch" | "dinner" | "snack";

export interface ScheduledMealReminder {
  id: string;
  mealType: MealSlotType;
  title: string;
  body: string;
  scheduledTime: string;
  hour: number;
  minute: number;
}

export const DEFAULT_MEAL_REMINDERS: ScheduledMealReminder[] = [
  {
    id: "meal-reminder-breakfast",
    mealType: "breakfast",
    title: "🍳 Breakfast check-in",
    body: "Take 10s to log or snap breakfast to keep your daily targets balanced.",
    scheduledTime: "10:00 AM",
    hour: 10,
    minute: 0,
  },
  {
    id: "meal-reminder-lunch",
    mealType: "lunch",
    title: "🥗 Lunch not logged yet",
    body: "You usually eat around now. Snap or speak your lunch to stay on track!",
    scheduledTime: "2:00 PM",
    hour: 14,
    minute: 0,
  },
  {
    id: "meal-reminder-dinner",
    mealType: "dinner",
    title: "🍲 Time for dinner",
    body: "Log your evening meal to wrap up your daily diary and protect your streak.",
    scheduledTime: "8:30 PM",
    hour: 20,
    minute: 30,
  },
  {
    id: "meal-reminder-streak",
    mealType: "snack",
    title: "🔥 Keep your streak alive",
    body: "Log your meals before midnight to lock in your daily streak!",
    scheduledTime: "9:45 PM",
    hour: 21,
    minute: 45,
  },
];

/**
 * Configure Android notification channels if on Android.
 */
async function setupAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      lightColor: "#1B4931",
    });
    await Notifications.setNotificationChannelAsync("meal-reminders", {
      name: "Meal & Habit Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      lightColor: "#1B4931",
    });
  }
}

/**
 * Request notification permissions from user.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === "granted") {
      await setupAndroidChannel();
      return true;
    }
    return false;
  } catch (err) {
    console.warn("Failed to request notification permissions:", err);
    return false;
  }
}

/**
 * Check if notifications are granted.
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

/**
 * Cancel a specific scheduled reminder by ID.
 */
export async function cancelReminder(id: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Graceful silence if already cancelled
  }
}

/**
 * Synchronize local push notifications based on today's logged meals.
 * If a meal is already logged today, its reminder is automatically cancelled.
 * If not logged, a timely daily notification nudge is scheduled.
 */
export async function syncMealReminders(
  todayMeals: MealRecord[],
  currentStreakDays: number = 0
): Promise<{ scheduled: string[]; cancelled: string[] }> {
  if (Platform.OS === "web") {
    return { scheduled: [], cancelled: [] };
  }

  const hasPermission = await checkNotificationPermissions();
  if (!hasPermission) {
    return { scheduled: [], cancelled: [] };
  }

  const hasBreakfast = todayMeals.some((m) => m.mealType === "breakfast" && !m.isSkipped);
  const hasLunch = todayMeals.some((m) => m.mealType === "lunch" && !m.isSkipped);
  const hasDinner = todayMeals.some((m) => m.mealType === "dinner" && !m.isSkipped);
  const hasDayStreakSecured = todayMeals.filter((m) => !m.isSkipped).length >= 2;

  const scheduled: string[] = [];
  const cancelled: string[] = [];

  for (const reminder of DEFAULT_MEAL_REMINDERS) {
    let isLogged = false;
    if (reminder.mealType === "breakfast") isLogged = hasBreakfast;
    else if (reminder.mealType === "lunch") isLogged = hasLunch;
    else if (reminder.mealType === "dinner") isLogged = hasDinner;
    else if (reminder.id === "meal-reminder-streak") isLogged = hasDayStreakSecured;

    if (isLogged) {
      await cancelReminder(reminder.id);
      cancelled.push(reminder.id);
    } else {
      try {
        // Cancel existing first to prevent duplicates
        await Notifications.cancelScheduledNotificationAsync(reminder.id);

        let dynamicBody = reminder.body;
        if (reminder.id === "meal-reminder-streak" && currentStreakDays > 0) {
          dynamicBody = `Protect your ${currentStreakDays}-day streak! Log your evening meal to lock it in today.`;
        }

        await Notifications.scheduleNotificationAsync({
          identifier: reminder.id,
          content: {
            title: reminder.title,
            body: dynamicBody,
            data: {
              mealType: reminder.mealType,
              action: "log_meal",
            },
            sound: true,
            ...(Platform.OS === "android" ? { channelId: "meal-reminders" } : {}),
          },
          trigger: {
            hour: reminder.hour,
            minute: reminder.minute,
            repeats: true,
          },
        });
        scheduled.push(reminder.id);
      } catch (err) {
        console.warn(`Failed to schedule reminder ${reminder.id}:`, err);
      }
    }
  }

  return { scheduled, cancelled };
}

/**
 * Fire an immediate test notification (2 seconds delay) to verify push notification setup.
 */
export async function sendTestNotification(
  mealType: MealSlotType = "lunch"
): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return false;

  const reminderInfo =
    DEFAULT_MEAL_REMINDERS.find((r) => r.mealType === mealType) ??
    DEFAULT_MEAL_REMINDERS[1]!;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `[Test] ${reminderInfo.title}`,
        body: `${reminderInfo.body} (Tap to open meal logger)`,
        data: {
          mealType: reminderInfo.mealType,
          action: "log_meal",
        },
        sound: true,
        ...(Platform.OS === "android" ? { channelId: "meal-reminders" } : {}),
      },
      trigger: {
        seconds: 2,
      },
    });
    return true;
  } catch (err) {
    console.warn("Failed to schedule test notification:", err);
    return false;
  }
}
