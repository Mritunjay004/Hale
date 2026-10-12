import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
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
import { generateUUID } from "../../src/lib/uuid";
import { IconArrowUp, IconSquare } from "../../src/ui";
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
  const { initialPrompt } = useLocalSearchParams<{ initialPrompt?: string }>();
  const initialHandledRef = useRef<string | null>(null);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Fetch thread and previous messages
  const { data, isLoading, refetch } = useQuery<ChatHistoryResponse>({
    queryKey: ["chatMessages"],
    queryFn: () => api.get<ChatHistoryResponse>("/chat/messages"),
    staleTime: 1000 * 60 * 5, // Cache message history for 5 minutes
    retry: 2,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages);
    }
  }, [data?.messages]);

  useEffect(() => {
    if (initialPrompt && initialPrompt !== initialHandledRef.current) {
      initialHandledRef.current = initialPrompt;
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [messages.length]);

  // Clean up in-flight request when screen unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCancelThinking = useCallback(() => {
    lightImpact();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    const cancelNotice: ChatMessage = {
      id: generateUUID(),
      role: "assistant",
      content: "Response cancelled.",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, cancelNotice]);
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || isSending) return;

    lightImpact();
    setInputText("");

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsSending(true);

    const tempUserMsg: ChatMessage = {
      id: generateUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await api.post<SendMessageResponse>(
        "/chat/messages",
        {
          content,
          threadId: data?.threadId,
        },
        { signal: controller.signal }
      );

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
    } catch (err: any) {
      if (err?.name === "AbortError" || controller.signal.aborted) {
        // User cancelled intentionally
        return;
      }
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: generateUUID(),
        role: "assistant",
        content: "I had trouble processing that. Please try again or rephrase.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsSending(false);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => <ChatBubble message={item} />,
    []
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const handleSelectPrompt = useCallback((prompt: string) => {
    handleSendMessage(prompt);
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: Math.max(insets.top, 16) + spacing.xs }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      {/* Top Live Grounding Banner */}
      <ContextBanner />

      {/* Virtualized Messages FlatList Area */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === "android"}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.brand.primary} />
              <Text style={styles.loadingText}>Syncing coach context...</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isSending ? (
            <View style={styles.thinkingRow}>
              <View style={styles.typingIndicator}>
                <Text style={styles.typingEmoji}>🤖</Text>
                <Text style={styles.typingText}>Coach is thinking...</Text>
                <ActivityIndicator size="small" color={colors.brand.primary} />
              </View>
              <Pressable
                style={({ pressed }) => [styles.cancelPill, pressed && { opacity: 0.7 }]}
                onPress={handleCancelThinking}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Cancel coach response"
              >
                <Text style={styles.cancelPillText}>✕ Stop</Text>
              </Pressable>
            </View>
          ) : null
        }
      />

      {/* Quick Prompt Chips */}
      <QuickPromptChips onSelectPrompt={handleSelectPrompt} />

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

        {isSending ? (
          <Pressable
            style={({ pressed }) => [styles.stopBtn, pressed && styles.btnPressed]}
            onPress={handleCancelThinking}
            accessibilityRole="button"
            accessibilityLabel="Stop response"
          >
            <IconSquare size={13} color={colors.text.inverse} />
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
              pressed && styles.btnPressed,
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send Message"
          >
            <View style={styles.arrowUpWrapper}>
              <IconArrowUp
                size={18}
                color={!inputText.trim() ? colors.text.muted : colors.text.inverse}
                strokeWidth={2.4}
              />
            </View>
          </Pressable>
        )}
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
  thinkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
    alignSelf: "flex-start",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cancelPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cancelPillText: {
    ...typography.badge,
    color: colors.semantic.error,
    fontWeight: "600",
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
  btnPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.88,
  },
  arrowUpWrapper: {
    transform: [{ translateY: -1 }],
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
  stopBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.semantic.error,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});
