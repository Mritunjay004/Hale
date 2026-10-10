import React from "react";
import { Stack } from "expo-router";
import { colors } from "../../src/theme/tokens.js";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.canvas },
      }}
    >
      <Stack.Screen name="welcome" />
    </Stack>
  );
}

