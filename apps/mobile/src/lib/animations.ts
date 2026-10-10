import { interpolate, Extrapolation } from "react-native-reanimated";

/**
 * Constrains a number between a minimum and maximum bound on the UI thread.
 */
export function clamp(value: number, min: number, max: number): number {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation (Redash-style mix) driven by a normalized 0 -> 1 progress value.
 */
export function mix(progress: number, from: number, to: number): number {
  "worklet";
  return from + progress * (to - from);
}

/**
 * Calculates resting snap point based on position + gesture velocity for fluid physics.
 */
export function snapPoint(
  value: number,
  velocity: number,
  points: number[]
): number {
  "worklet";
  const point = value + 0.2 * velocity;
  const deltas = points.map((p) => Math.abs(point - p));
  const minDelta = Math.min(...deltas);
  return points.find((p) => Math.abs(point - p) === minDelta) ?? points[0]!;
}

/**
 * Default organic spring config for Hale UI elements.
 */
export const springConfig = {
  damping: 16,
  stiffness: 140,
  mass: 0.9,
};

