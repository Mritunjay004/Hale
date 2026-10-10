import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing, radius } from "../../theme/tokens";
import type { ChatMessage, ToolCall } from "@hale/shared";

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🤖</Text>
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>

        {/* Tool Call Cards */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <View style={styles.toolList}>
            {message.toolCalls.map((tc: ToolCall) => (
              <ToolResultCard key={tc.id} tool={tc} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function ToolResultCard({ tool }: { tool: ToolCall }) {
  if (tool.name === "log_meal") {
    return (
      <View style={styles.toolCard}>
        <View style={styles.toolHeader}>
          <Text style={styles.toolEmoji}>🍽️</Text>
          <Text style={styles.toolTitle}>Meal Logged</Text>
          <Text style={styles.toolCheck}>✓ Saved</Text>
        </View>
        <Text style={styles.toolSummary}>{tool.result?.summary}</Text>
      </View>
    );
  }

  if (tool.name === "explain_biomarker") {
    return (
      <View style={[styles.toolCard, styles.biomarkerToolCard]}>
        <View style={styles.toolHeader}>
          <Text style={styles.toolEmoji}>💡</Text>
          <Text style={styles.toolTitle}>Clinical Reference Context</Text>
        </View>
        <Text style={styles.toolSummary}>{tool.result?.summary}</Text>
      </View>
    );
  }

  if (tool.name === "suggest_meal") {
    return (
      <View style={[styles.toolCard, styles.suggestToolCard]}>
        <View style={styles.toolHeader}>
          <Text style={styles.toolEmoji}>🥗</Text>
          <Text style={styles.toolTitle}>Personalized Nutrition Suggestion</Text>
        </View>
        <Text style={styles.toolSummary}>{tool.result?.summary}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: spacing.xs,
    gap: spacing.xs,
  },
  userContainer: {
    justifyContent: "flex-end",
  },
  assistantContainer: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarEmoji: {
    fontSize: 16,
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  userBubble: {
    backgroundColor: colors.brand.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...typography.body,
    lineHeight: 22,
  },
  userText: {
    color: colors.text.inverse,
  },
  assistantText: {
    color: colors.text.primary,
  },
  toolList: {
    gap: spacing.xs,
    marginTop: 4,
  },
  toolCard: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 2,
  },
  biomarkerToolCard: {
    backgroundColor: colors.brand.accentLight,
    borderColor: "#FAD4C0",
  },
  suggestToolCard: {
    backgroundColor: colors.brand.primaryLight,
    borderColor: "#C5E8D6",
  },
  toolHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  toolEmoji: {
    fontSize: 14,
  },
  toolTitle: {
    ...typography.badge,
    color: colors.text.primary,
    fontWeight: "700",
    flex: 1,
  },
  toolCheck: {
    ...typography.badge,
    color: colors.semantic.success,
    fontWeight: "800",
  },
  toolSummary: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});
