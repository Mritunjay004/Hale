import React from "react";
import { Stack } from "expo-router";
import { colors } from "../../src/theme/tokens";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.canvas },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="about" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="lifestyle" />
      <Stack.Screen name="plan" />
    </Stack>
  );
}

