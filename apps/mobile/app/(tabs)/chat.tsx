import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../src/lib/api-client";
import { colors, spacing, radius, typography } from "../../src/theme/tokens";
import {
  ChatBubble,
  QuickPromptChips,
  ContextBanner,
} from "../../src/features/chat";
import { lightImpact, successNotification } from "../../src/lib/haptics";
import type { ChatMessage } from "@hale/shared";

interface ChatHistoryResponse {
  threadId: string;
  messages: ChatMessage[];
}

interface SendMessageResponse {
  threadId: string;
  message: ChatMessage;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Fetch thread and previous messages
  const { data, isLoading, refetch } = useQuery<ChatHistoryResponse>({
    queryKey: ["chatMessages"],
    queryFn: () => api.get<ChatHistoryResponse>("/chat/messages"),
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages);
    }
  }, [data?.messages]);

  useEffect(() => {
    // Scroll to bottom on new messages
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || isSending) return;

    lightImpact();
    setInputText("");
    setIsSending(true);

    const tempUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await api.post<SendMessageResponse>("/chat/messages", {
        content,
        threadId: data?.threadId,
      });

      if (response?.message) {
        setMessages((prev) => [...prev, response.message]);

        // If assistant logged a meal, update Today query!
        const hasMealLogged = response.message.toolCalls?.some(
          (tc) => tc.name === "log_meal"
        );
        if (hasMealLogged) {
          successNotification();
          queryClient.invalidateQueries({ queryKey: ["today"] });
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I had trouble processing that. Please try again or rephrase.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: Math.max(insets.top, 16) + spacing.xs }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      {/* Top Live Grounding Banner */}
      <ContextBanner />

      {/* Messages Scroll Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.brand.primary} />
            <Text style={styles.loadingText}>Syncing coach context...</Text>
          </View>
        ) : (
          messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)
        )}

        {isSending && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingEmoji}>🤖</Text>
            <Text style={styles.typingText}>Coach is thinking...</Text>
            <ActivityIndicator size="small" color={colors.brand.primary} />
          </View>
        )}
      </ScrollView>

      {/* Quick Prompt Chips */}
      <QuickPromptChips onSelectPrompt={(prompt) => handleSendMessage(prompt)} />

      {/* Bottom Message Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask coach or type 'Log 2 rotis & dal'..."
          placeholderTextColor={colors.text.muted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => handleSendMessage()}
        />

        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            (!inputText.trim() || isSending) && styles.sendBtnDisabled,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => handleSendMessage()}
          disabled={!inputText.trim() || isSending}
          accessibilityRole="button"
          accessibilityLabel="Send Message"
        >
          <Text style={styles.sendIcon}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  loadingText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bg.surface,
    alignSelf: "flex-start",
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginTop: spacing.xs,
  },
  typingEmoji: {
    fontSize: 14,
  },
  typingText: {
    ...typography.badge,
    color: colors.text.secondary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    ...typography.body,
    color: colors.text.primary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: colors.border.subtle,
  },
  sendIcon: {
    color: colors.text.inverse,
    fontSize: 20,
    fontWeight: "800",
  },
});
