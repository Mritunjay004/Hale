import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import { lightImpact } from "../../lib/haptics";

interface QuickPromptChipsProps {
  onSelectPrompt: (promptText: string) => void;
}

const PROMPTS = [
  { emoji: "🥗", text: "What dinner should I eat to hit 30g protein?" },
  { emoji: "📊", text: "How are my calorie and macro targets looking today?" },
  { emoji: "☀️", text: "Why is low Vitamin D linked to afternoon fatigue?" },
  { emoji: "🍳", text: "Log meal: 2 rotis and yellow dal" },
];

export const QuickPromptChips = React.memo(function QuickPromptChips({
  onSelectPrompt,
}: QuickPromptChipsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PROMPTS.map((p, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.8 }]}
            onPress={() => {
              lightImpact();
              onSelectPrompt(p.text);
            }}
            accessibilityRole="button"
            accessibilityLabel={p.text}
          >
            <Text style={styles.chipEmoji}>{p.emoji}</Text>
            <Text style={styles.chipText}>{p.text}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.xs,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipText: {
    ...typography.badge,
    color: colors.text.secondary,
    fontWeight: "600",
  },
});

