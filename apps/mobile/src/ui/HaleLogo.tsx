import React from "react";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "../theme/tokens";

interface HaleLogoProps {
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export function HaleLogo({
  size = 64,
  color = colors.brand.primary,
  backgroundColor = colors.brand.primaryLight,
}: HaleLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Soft rounded background badge */}
      {backgroundColor && (
        <Circle cx="32" cy="32" r="30" fill={backgroundColor} />
      )}

      {/* Elegant minimalist botanical branch representing health & vitality */}
      <Path
        d="M20 46C20 46 26 36 34 26C40 18.5 48 14 48 14C48 14 43.5 22 36 28C28 34.5 20 46 20 46Z"
        fill={color}
      />
      <Path
        d="M34 26C38 23 44 24 45 28C45.5 30 43 32 38 31C35 30.5 34 26 34 26Z"
        fill={color}
        opacity={0.9}
      />
      <Path
        d="M28 33C24 32 20 35 21 39C21.5 41 24.5 41.5 28.5 39C30.5 37.5 28 33 28 33Z"
        fill={color}
        opacity={0.85}
      />
      <Path
        d="M38 22C38 18 42 16 45 18C46.5 19 46 22 43 23C40.5 23.8 38 22 38 22Z"
        fill={color}
        opacity={0.95}
      />
    </Svg>
  );
}

