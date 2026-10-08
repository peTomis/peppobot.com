import Image from "next/image";
import type { SVGProps } from "react";

/** Dot-matrix hexagon pattern from the design, as a single SVG path; `r` is the dot radius on a 7-unit grid. */
function dotHexPath(r: number) {
  const step = 7, cx = 43.3, cy = 50;
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
}

const DEFAULT_RADIUS = 1.6;
const DEFAULT_PATH = dotHexPath(DEFAULT_RADIUS);
const pathFor = (radius: number) => (radius === DEFAULT_RADIUS ? DEFAULT_PATH : dotHexPath(radius));

export function DotHex({ fill, radius = DEFAULT_RADIUS, ...props }: SVGProps<SVGSVGElement> & { fill: string; radius?: number }) {
  return (
    <svg viewBox="0 0 86.6 100" aria-hidden {...props}>
      <path d={pathFor(radius)} style={{ fill }} />
    </svg>
  );
}

/** The dot pattern as a CSS mask, to show an image through the dots. */
const dotHexMask = (radius: number) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 86.6 100"><path d="${pathFor(radius)}"/></svg>`)}")`;

/** An image seen through the dot-matrix hexagon. */
export function DotHexImage({ src, sizes, radius = DEFAULT_RADIUS, className }: { src: string; sizes: string; radius?: number; className?: string }) {
  return (
    <div aria-hidden style={{ maskImage: dotHexMask(radius), maskSize: "100% 100%" }} className={`aspect-[86.6/100] ${className ?? ""}`}>
      <Image draggable={false} src={src} alt="" fill sizes={sizes} className="object-cover" />
    </div>
  );
}
