import { PLATFORMS, type Platform } from "@/content/games";

/**
 * A platform's brand logo in the current text color (the SVG is used as a mask): `className`
 * sets the height, the logo's ratio the width. Its full name goes to screen readers and the
 * tooltip. Platforms without a logo show their name.
 */
export function PlatformLogo({ platform, className = "h-4" }: { platform: Platform; className?: string }) {
  const entry = PLATFORMS[platform];
  if (!entry) return null;
  if (!entry.logo) return <span>{entry.name}</span>;
  return (
    <span
      role="img"
      aria-label={entry.name}
      title={entry.name}
      style={{ maskImage: `url(/icons/${entry.logo.file}.svg)`, aspectRatio: entry.logo.ratio }}
      className={`inline-block shrink-0 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] ${className}`}
    />
  );
}
