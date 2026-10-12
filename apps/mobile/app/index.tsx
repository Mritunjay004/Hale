import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { getSecureItem } from "../src/lib/secure-storage";
import { ONBOARDED_KEY } from "../src/lib/api-client";
import { colors } from "../src/theme/tokens";

export default function Index() {
  const [targetRoute, setTargetRoute] = useState<string | null>(null);

  useEffect(() => {
    async function determineRoute() {
      try {
        const onboarded = await getSecureItem(ONBOARDED_KEY);
        if (onboarded === "true") {
          setTargetRoute("/(tabs)");
        } else {
          setTargetRoute("/onboarding/welcome");
        }
      } catch {
        setTargetRoute("/onboarding/welcome");
      }
    }
    determineRoute();
  }, []);

  if (!targetRoute) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg.canvas,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="small" color={colors.brand.primary} />
      </View>
    );
  }

  return <Redirect href={targetRoute as any} />;
}
