import React from "react";
import Svg, { Path, Rect } from "react-native-svg";
import { colors } from "../../theme/tokens";

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Optically aligned right arrow with stem for action buttons.
 */
export function IconArrowRight({
  size = 18,
  color = colors.text.primary,
  strokeWidth = 2.2,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M13 5l7 7-7 7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Optically centered up arrow for send buttons.
 */
export function IconArrowUp({
  size = 18,
  color = colors.text.inverse,
  strokeWidth = 2.4,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19V5M5 12l7-7 7 7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Stopped square icon for canceling coach generations.
 */
export function IconSquare({
  size = 14,
  color = colors.text.inverse,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="3"
        fill={color}
      />
    </Svg>
  );
}

/**
 * Optically centered plus icon for the primary FAB.
 */
export function IconPlus({
  size = 24,
  color = colors.text.inverse,
  strokeWidth = 2.5,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Home tab navigation icon supporting outline (inactive) and filled (active) states.
 */
export function IconHome({
  size = 22,
  color = colors.text.muted,
  focused = false,
}: IconProps & { focused?: boolean }) {
  if (focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 10.25L12 3l9 7.25V20a1 1 0 01-1 1h-4.5a1 1 0 01-1-1v-5a1 1 0 00-1-1h-3a1 1 0 00-1 1v5a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.75z"
          fill={color}
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.25L12 3l9 7.25V20a1 1 0 01-1 1h-4.5a1 1 0 01-1-1v-5a1 1 0 00-1-1h-3a1 1 0 00-1 1v5a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.75z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Coach tab navigation icon with smooth conversational speech balloon.
 */
export function IconCoach({
  size = 22,
  color = colors.text.muted,
  focused = false,
}: IconProps & { focused?: boolean }) {
  if (focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20.5 11.5a8 8 0 01-.86 3.63 8.1 8.1 0 01-7.25 4.47 8 8 0 01-3.63-.86L3.5 20.5l1.76-5.26a8 8 0 01-.86-3.64 8.1 8.1 0 014.47-7.24 8 8 0 013.63-.86h.5a8.1 8.1 0 017.5 7.5v.5z"
          fill={color}
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.5 11.5a8 8 0 01-.86 3.63 8.1 8.1 0 01-7.25 4.47 8 8 0 01-3.63-.86L3.5 20.5l1.76-5.26a8 8 0 01-.86-3.64 8.1 8.1 0 014.47-7.24 8 8 0 013.63-.86h.5a8.1 8.1 0 017.5 7.5v.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Reports tab navigation icon representing structured medical pathology reports.
 */
export function IconReports({
  size = 22,
  color = colors.text.muted,
  focused = false,
}: IconProps & { focused?: boolean }) {
  if (focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
          fill={color}
        />
        <Path d="M14 2v6h6" fill="rgba(255,255,255,0.4)" />
        <Path
          d="M16 13H8M16 17H8M10 9H8"
          stroke={colors.bg.surface}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Bell icon for push notification reminders.
 */
export function IconBell({
  size = 18,
  color = colors.text.muted,
  strokeWidth = 2,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Checkmark icon for completed states.
 */
export function IconCheck({
  size = 16,
  color = colors.semantic.success,
  strokeWidth = 2.4,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}


