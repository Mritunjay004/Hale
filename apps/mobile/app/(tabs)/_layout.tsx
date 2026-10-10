import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useBreakpoint } from "../../src/lib/breakpoint.js";
import { colors, spacing, radius, typography, shadows } from "../../src/theme/tokens.js";
import { ResponsiveSheet } from "../../src/ui/ResponsiveSheet.js";
import { Button } from "../../src/ui/Button.js";

export default function TabsLayout() {
  const { isDesktop } = useBreakpoint();
  const [logSheetVisible, setLogSheetVisible] = useState(false);
  const router = useRouter();

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
                onPress={() => setLogSheetVisible(true)}
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
              setLogSheetVisible(true);
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

      {/* Global Capture ResponsiveSheet */}
      <ResponsiveSheet
        visible={logSheetVisible}
        onClose={() => setLogSheetVisible(false)}
        title="Log Meal (Under 10s)"
      >
        <View style={styles.sheetContent}>
          <View style={styles.voiceHero}>
            <Pressable
              style={styles.micCircle}
              onPress={() => {
                setLogSheetVisible(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Start voice recording"
            >
              <Text style={{ fontSize: 32 }}>🎙</Text>
            </Pressable>
            <Text style={styles.voiceTitle}>Tap to speak your meal</Text>
            <Text style={styles.voiceSub}>
              "Two rotis, bowl of dal, and cucumber salad"
            </Text>
          </View>

          <View style={styles.actionRow}>
            <Button
              label="📷 Snap Plate"
              variant="secondary"
              onPress={() => setLogSheetVisible(false)}
              style={{ flex: 1 }}
            />
            <Button
              label="⌨️ Quick Type"
              variant="secondary"
              onPress={() => setLogSheetVisible(false)}
              style={{ flex: 1 }}
            />
          </View>
        </View>
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

