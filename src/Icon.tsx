import type { CSSProperties } from 'react';

interface IconProps {
  name: string;
  size?: number;
  fill?: boolean;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  grade?: -25 | 0 | 200;
  opticalSize?: 20 | 24 | 40 | 48;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

/**
 * Material Symbols icon component
 * Uses Google Fonts CDN for Material Symbols Rounded
 * 
 * @param name - The icon name (e.g., 'bolt', 'warning', 'home')
 * @param size - Icon size in pixels (default: 24)
 * @param fill - Whether to fill the icon (default: false)
 * @param weight - Font weight 100-700 (default: 400)
 * @param grade - Optical grade -25 to 200 (default: 0)
 * @param opticalSize - Optical size 20-48 (default: 24)
 * @param className - Additional CSS classes
 * @param style - Inline styles
 * @param ariaLabel - Accessibility label (required for semantic icons)
 */
export default function Icon({
  name,
  size = 24,
  fill = false,
  weight = 400,
  grade = 0,
  opticalSize = 24,
  className = '',
  style = {},
  ariaLabel,
}: IconProps) {
  return (
    <span
      className={`material-symbols-rounded ${className}`}
      style={{
        fontSize: `${size}px`,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
        lineHeight: 1,
        display: 'inline-block',
        userSelect: 'none',
        ...style,
      }}
      aria-label={ariaLabel || undefined}
      aria-hidden={!ariaLabel || undefined}
      role={ariaLabel ? 'img' : undefined}
    >
      {name}
    </span>
  );
}
