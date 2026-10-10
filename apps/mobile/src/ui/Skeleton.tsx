import React from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { colors, radius } from "../theme/tokens";

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = radius.sm,
  style,
}: SkeletonProps) {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as ViewStyle["width"],
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.bg.subtle,
    overflow: "hidden",
  },
});

