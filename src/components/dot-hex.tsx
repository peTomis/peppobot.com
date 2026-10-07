import type { SVGProps } from "react";

/** Dot-matrix hexagon pattern from the design, as a single SVG path. */
const DOT_HEX_PATH = (() => {
  const r = 1.6, step = 7, cx = 43.3, cy = 50;
  const dots: string[] = [];
  for (let j = -12; j <= 12; j++) {
    for (let k = -10; k <= 10; k++) {
      const dx = k * step, dy = j * step;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (ax <= cx - r && ay <= 50 - ax * 0.5774 - r * 1.1547) {
        const x = cx + dx, y = cy + dy;
        dots.push(
          `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`,
        );
      }
    }
  }
  return dots.join("");
})();

export function DotHex({ fill, ...props }: SVGProps<SVGSVGElement> & { fill: string }) {
  return (
    <svg viewBox="0 0 86.6 100" aria-hidden {...props}>
      <path d={DOT_HEX_PATH} style={{ fill }} />
    </svg>
  );
}
