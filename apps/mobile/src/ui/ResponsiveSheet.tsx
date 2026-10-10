import React, { type ReactNode } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { useBreakpoint } from "../lib/breakpoint.js";
import { colors, spacing, radius, typography, shadows } from "../theme/tokens.js";

export interface ResponsiveSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  contentStyle?: ViewStyle;
}

/**
 * Adaptive ResponsiveSheet:
 * - Mobile (< 768px): slides up as a bottom sheet with handle
 * - Desktop/Tablet (>= 768px): renders as a centered floating modal with backdrop
 */
export function ResponsiveSheet({
  visible,
  onClose,
  title,
  children,
  contentStyle,
}: ResponsiveSheetProps) {
  const { isMobile } = useBreakpoint();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType={isMobile ? "slide" : "fade"}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Click outside backdrop to close */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close overlay"
        />

        <View
          style={[
            isMobile ? styles.bottomSheet : styles.centeredModal,
            contentStyle,
          ]}
        >
          {/* Mobile Drag Handle Indicator */}
          {isMobile && <View style={styles.handle} />}

          {/* Header */}
          {(title || !isMobile) && (
            <View style={styles.header}>
              {title ? (
                <Text style={styles.title}>{title}</Text>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={styles.closeBtn}
              >
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>
          )}

          {/* Sheet Body Content */}
          <View style={styles.body}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing["2xl"],
    paddingHorizontal: spacing.md,
    maxHeight: "90%",
    ...shadows.modal,
  },
  centeredModal: {
    alignSelf: "center",
    marginBottom: "auto",
    marginTop: "auto",
    width: "100%",
    maxWidth: 580,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    maxHeight: "85%",
    ...shadows.modal,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: radius.full,
    alignSelf: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 18,
    color: colors.text.muted,
    fontWeight: "600",
  },
  body: {
    flexShrink: 1,
  },
});

