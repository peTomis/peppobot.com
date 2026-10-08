type Accent = "acc" | "acc2" | "acc3";

// Full class names, so Tailwind sees every variant.
const BACKGROUNDS: Record<Accent, string> = { acc: "bg-acc", acc2: "bg-acc2", acc3: "bg-acc3" };
const STROKES: Record<Accent, { large: string; small: string }> = {
  acc: { large: "[-webkit-text-stroke:2px_var(--acc)]", small: "[-webkit-text-stroke:1.5px_var(--acc)]" },
  acc2: { large: "[-webkit-text-stroke:2px_var(--acc2)]", small: "[-webkit-text-stroke:1.5px_var(--acc2)]" },
  acc3: { large: "[-webkit-text-stroke:2px_var(--acc3)]", small: "[-webkit-text-stroke:1.5px_var(--acc3)]" },
};

/** Numbered section heading: hexagon index, solid word, outlined word. `small` is the inner-page size. */
export function SectionHeading({ id, index, first, second, accent, small = false }: { id: string; index: string; first: string; second: string; accent: Accent; small?: boolean }) {
  return (
    <div className="flex items-center gap-5">
      <span
        aria-hidden
        className={`hex grid shrink-0 place-items-center font-mono font-bold text-bg ${small ? "h-12 w-14 text-base" : "h-14 w-16 text-lg"} ${BACKGROUNDS[accent]}`}
      >
        {index}
      </span>
      <h2
        id={id}
        className={`flex flex-wrap font-display leading-[0.9] font-bold uppercase ${small ? "gap-3 text-[clamp(28px,3.4vw,44px)]" : "gap-4 text-[clamp(36px,5vw,64px)]"}`}
      >
        <span className="text-fg">{first}</span>
        <span className={`text-transparent ${STROKES[accent][small ? "small" : "large"]}`}>{second}</span>
      </h2>
    </div>
  );
}
