import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Tabs, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBreakpoint } from "../../src/lib/breakpoint";
import {
  colors,
  spacing,
  radius,
  typography,
  shadows,
} from "../../src/theme/tokens";
import { lightImpact } from "../../src/lib/haptics";
import { ResponsiveSheet } from "../../src/ui/ResponsiveSheet";
import { Button } from "../../src/ui/Button";
import {
  IconHome,
  IconCoach,
  IconReports,
  IconPlus,
} from "../../src/ui/icons";
import { MealCaptureContent } from "../../src/features/food-log/MealCaptureContent";
import { MealConfirmationContent } from "../../src/features/food-log/MealConfirmationContent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../src/lib/api-client";
import { useMealCaptureStore } from "../../src/features/food-log/useMealCaptureStore";
import type { ParsedMeal, MealSource, TodayResponse } from "@hale/shared";

export default function TabsLayout() {
  const { isDesktop } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const {
    isOpen: logSheetVisible,
    parsedMeal,
    mealSource,
    rawInput,
    suggestedMealType,
    openCapture,
    closeCapture,
    setParsed,
    resetToCapture,
  } = useMealCaptureStore();
  const router = useRouter();

  const { data: todayData } = useQuery<TodayResponse>({
    queryKey: ["today"],
    queryFn: () => api.get<TodayResponse>("/today"),
  });

  const handleOpenSheet = () => {
    lightImpact();
    openCapture();
  };

  const handleCloseSheet = () => {
    closeCapture();
  };

  const handleSaved = () => {
    closeCapture();
    queryClient.invalidateQueries({ queryKey: ["today"] });
  };

  useEffect(() => {
    if (Platform.OS === "web") return;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const payload = response.notification.request.content.data;
      if (payload?.action === "log_meal" && payload?.mealType) {
        openCapture(payload.mealType as any);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [openCapture]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: isDesktop
            ? styles.desktopHidden
            : [
                styles.tabBar,
                {
                  height: 58 + insets.bottom,
                  paddingBottom: Math.max(insets.bottom, 6),
                },
              ],
          tabBarActiveTintColor: colors.brand.primary,
          tabBarInactiveTintColor: colors.text.muted,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Today",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
                <IconHome size={20} color={color} focused={focused} />
              </View>
            ),
          }}
          listeners={{
            tabPress: () => {
              lightImpact();
            },
          }}
        />

        {/* Center "+" FAB Action */}
        <Tabs.Screen
          name="log-action"
          options={{
            title: "",
            tabBarButton: () => (
              <Pressable
                onPress={handleOpenSheet}
                style={({ pressed }) => [
                  styles.fabContainer,
                  { bottom: insets.bottom > 0 ? insets.bottom / 2 : 0 },
                  pressed && styles.fabPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Log Food"
              >
                <View style={styles.fab}>
                  <IconPlus size={24} color={colors.text.inverse} strokeWidth={2.6} />
                </View>
              </Pressable>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              handleOpenSheet();
            },
          }}
        />

        <Tabs.Screen
          name="chat"
          options={{
            title: "Coach",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
                <IconCoach size={20} color={color} focused={focused} />
              </View>
            ),
          }}
          listeners={{
            tabPress: () => {
              lightImpact();
            },
          }}
        />

        <Tabs.Screen
          name="reports"
          options={{
            title: "Reports",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
                <IconReports size={20} color={color} focused={focused} />
              </View>
            ),
          }}
          listeners={{
            tabPress: () => {
              lightImpact();
            },
          }}
        />
      </Tabs>

      {/* Global Capture & Confirmation ResponsiveSheet */}
      <ResponsiveSheet
        visible={logSheetVisible}
        onClose={handleCloseSheet}
        title={parsedMeal ? "Confirm Meal" : "Log Meal"}
      >
        {parsedMeal ? (
          <MealConfirmationContent
            parsedMeal={parsedMeal}
            source={mealSource}
            rawInput={rawInput}
            loggedMeals={todayData?.timelineMeals ?? []}
            suggestedMealType={suggestedMealType}
            onSaved={handleSaved}
            onBack={resetToCapture}
          />
        ) : (
          <MealCaptureContent
            onParsed={(meal, source, raw) => {
              setParsed(meal, source, raw);
            }}
            onClose={handleCloseSheet}
          />
        )}
      </ResponsiveSheet>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bg.surface,
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    height: 60,
    paddingTop: 5,
  },
  desktopHidden: {
    display: "none",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginTop: 2,
  },
  tabIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tabIconWrapperActive: {
    backgroundColor: colors.brand.primaryLight,
  },
  fabContainer: {
    top: -16,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.bg.surface,
    ...shadows.floating,
  },
  fabPressed: {
    transform: [{ scale: 0.93 }],
    opacity: 0.9,
  },
  sheetContent: {
    gap: spacing.md,
  },
  voiceHero: {
    backgroundColor: colors.brand.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
  },
  micCircle: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    ...shadows.floating,
  },
  voiceTitle: {
    ...typography.h3,
    color: colors.brand.primary,
  },
  voiceSub: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
