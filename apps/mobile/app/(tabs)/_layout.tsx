import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useBreakpoint } from "../../src/lib/breakpoint";
import { colors, spacing, radius, typography, shadows } from "../../src/theme/tokens";
import { ResponsiveSheet } from "../../src/ui/ResponsiveSheet";
import { Button } from "../../src/ui/Button";
import { MealCaptureContent } from "../../src/features/food-log/MealCaptureContent";
import { MealConfirmationContent } from "../../src/features/food-log/MealConfirmationContent";
import { useQueryClient } from "@tanstack/react-query";
import { useMealCaptureStore } from "../../src/features/food-log/useMealCaptureStore";
import type { ParsedMeal, MealSource } from "@hale/shared";

export default function TabsLayout() {
  const { isDesktop } = useBreakpoint();
  const queryClient = useQueryClient();
  const {
    isOpen: logSheetVisible,
    parsedMeal,
    mealSource,
    rawInput,
    openCapture,
    closeCapture,
    setParsed,
    resetToCapture,
  } = useMealCaptureStore();
  const router = useRouter();

  const handleOpenSheet = () => {
    openCapture();
  };

  const handleCloseSheet = () => {
    closeCapture();
  };

  const handleSaved = () => {
    closeCapture();
    queryClient.invalidateQueries({ queryKey: ["today"] });
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: isDesktop ? styles.desktopHidden : styles.tabBar,
          tabBarActiveTintColor: colors.brand.primary,
          tabBarInactiveTintColor: colors.text.muted,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Today",
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
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
                style={styles.fabContainer}
                accessibilityRole="button"
                accessibilityLabel="Log Food"
              >
                <View style={styles.fab}>
                  <Text style={styles.fabPlus}>+</Text>
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
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💬</Text>,
          }}
        />

        <Tabs.Screen
          name="reports"
          options={{
            title: "Reports",
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📄</Text>,
          }}
        />
      </Tabs>

      {/* Global Capture & Confirmation ResponsiveSheet */}
      <ResponsiveSheet
        visible={logSheetVisible}
        onClose={handleCloseSheet}
        title={parsedMeal ? "Confirm Meal" : "Log Meal (Under 10s)"}
      >
        {parsedMeal ? (
          <MealConfirmationContent
            parsedMeal={parsedMeal}
            source={mealSource}
            rawInput={rawInput}
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
    height: 64,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
  },
  desktopHidden: {
    display: "none",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  fabContainer: {
    top: -18,
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
    ...shadows.floating,
  },
  fabPlus: {
    color: colors.text.inverse,
    fontSize: 28,
    fontWeight: "400",
    lineHeight: 32,
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

