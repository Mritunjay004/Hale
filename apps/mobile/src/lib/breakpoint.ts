import { useWindowDimensions } from "react-native";

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export function useBreakpoint(): BreakpointState {
  const { width, height } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  return {
    isMobile,
    isTablet,
    isDesktop,
    width,
    height,
  };
}

