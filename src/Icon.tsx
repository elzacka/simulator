import type { CSSProperties } from "react";

// SVGs from Lucide, Tabler, Heroicons and Material Symbols; licences beside each set in src/ikoner/
const SVG = import.meta.glob<string>("./ikoner/**/*.svg", { query: "?raw", import: "default", eager: true });

interface IconProps {
  name: string; // "<library>/<name>", e.g. "lucide/cctv"
  size?: number;
  style?: CSSProperties;
}

export default function Icon({ name, size = 24, style }: IconProps) {
  const svg = SVG[`./ikoner/${name}.svg`];
  if (!svg) console.warn(`Unknown icon: ${name}`);
  return (
    <span
      className="ikon"
      aria-hidden="true"
      style={{ width: size, height: size, ...style }}
      dangerouslySetInnerHTML={{ __html: svg ?? "" }}
    />
  );
}
