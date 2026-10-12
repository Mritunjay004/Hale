import { Platform, type ViewStyle } from "react-native";

export const colors = {
  brand: {
    primary: "#1B4931",
    primaryLight: "#E8F0EA",
    primaryDark: "#123322",
    accent: "#E07A5F",
    accentLight: "#FDF1ED",
  },
  bg: {
    canvas: "#FBFBF9",
    surface: "#FFFFFF",
    subtle: "#F3F4EE",
  },
  border: {
    subtle: "#E5E7EB",
    focus: "#1B4931",
  },
  text: {
    primary: "#191C1E",
    secondary: "#4B5563",
    muted: "#6B7280",
    inverse: "#FFFFFF",
  },
  semantic: {
    success: "#2D6A4F",
    successLight: "#EAF4EE",
    info: "#2563EB",
    infoLight: "#EFF6FF",
    warn: "#D97706",
    warnLight: "#FEF3C7",
    error: "#DC2626",
    errorLight: "#FEE2E2",
  },
} as const;

export const motion = {
  durations: {
    instant: 80,
    fast: 150,
    normal: 200,
    slow: 300,
  },
} as const;

export const hitSlop = {
  sm: { top: 6, bottom: 6, left: 6, right: 6 },
  md: { top: 10, bottom: 10, left: 10, right: 10 },
  lg: { top: 16, bottom: 16, left: 16, right: 16 },
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: "700" as const },
  h1: { fontSize: 24, lineHeight: 32, fontWeight: "600" as const },
  h2: { fontSize: 20, lineHeight: 28, fontWeight: "600" as const },
  h3: { fontSize: 17, lineHeight: 24, fontWeight: "600" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  bodyMedium: { fontSize: 15, lineHeight: 22, fontWeight: "500" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  badge: { fontSize: 11, lineHeight: 14, fontWeight: "600" as const },
} as const;

export const shadows: Record<"card" | "floating" | "modal", ViewStyle> = {
  card: Platform.select<ViewStyle>({
    web: {
      boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04), 0px 1px 3px rgba(0, 0, 0, 0.02)",
    } as unknown as ViewStyle,
    default: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
  })!,
  floating: Platform.select<ViewStyle>({
    web: {
      boxShadow: "0px 10px 28px rgba(27, 73, 49, 0.16), 0px 4px 10px rgba(0, 0, 0, 0.04)",
    } as unknown as ViewStyle,
    default: {
      shadowColor: "#1B4931",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 14,
      elevation: 8,
    },
  })!,
  modal: Platform.select<ViewStyle>({
    web: {
      boxShadow: "0px 20px 48px rgba(0, 0, 0, 0.14), 0px 6px 16px rgba(0, 0, 0, 0.06)",
    } as unknown as ViewStyle,
    default: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 24,
      elevation: 12,
    },
  })!,
};

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
} as const;

