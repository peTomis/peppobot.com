import Image from "next/image";
import type { ReactNode } from "react";
import type { Accent, ReportBlock, ReportImage } from "@/content/games";
import type { Locale } from "@/i18n/config";
import { pickTranslation, type Translated } from "@/i18n/translations";
import { TranslatedText } from "./translated-text";

const ACCENTS: Accent[] = ["acc", "acc2", "acc3"];
const BG = { acc: "bg-acc", acc2: "bg-acc2", acc3: "bg-acc3" } as const;
const TEXT = { acc: "text-acc", acc2: "text-acc2", acc3: "text-acc3" } as const;

const placeholder = "grid place-items-center bg-[repeating-linear-gradient(135deg,#2a1b40_0_12px,#170f24_12px_24px)] p-4 text-center font-mono text-[11px] tracking-[0.12em] text-fg-dim uppercase";

/** The written report: headings, paragraphs, images, quotes and fact tiles, in order. */
export function ReportBlocks({ blocks, lang }: { blocks: ReportBlock[]; lang: Locale }) {
  return blocks.map((block, index) => {
    // Accents cycle through the blocks, unless a block picks its own.
    const accent = ("accent" in block && block.accent) || ACCENTS[index % ACCENTS.length];
    switch (block.type) {
      case "heading":
        return (
          <h3 key={index} className="mt-4 flex items-center gap-3.5 font-display text-[clamp(24px,2.6vw,32px)] leading-none font-bold text-fg uppercase">
            <span aria-hidden className={`hex h-4.25 w-5 shrink-0 ${BG[accent]}`} />
            <TranslatedText text={block.text} lang={lang} as="span" />
          </h3>
        );
      case "paragraph":
        return <TranslatedText key={index} text={block.text} lang={lang} className="max-w-[70ch] text-lg leading-[1.75] text-pretty text-fg-soft" />;
      case "image":
        return (
          <Figure key={index} caption={block.caption} lang={lang}>
            <div className="relative [clip-path:polygon(0_0,100%_0,100%_calc(100%-36px),calc(100%-36px)_100%,0_100%)]">
              <Picture image={block.image} lang={lang} className="aspect-video" sizes="(min-width: 1024px) 800px, 100vw" />
              <div className={`absolute bottom-0 left-0 h-2 w-full ${BG[accent]}`} />
            </div>
          </Figure>
        );
      case "pair":
        return (
          <Figure key={index} caption={block.caption} lang={lang}>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
              <Picture image={block.images[0]} lang={lang} className="aspect-[4/3]" sizes="(min-width: 1024px) 400px, 100vw" />
              <Picture
                image={block.images[1]}
                lang={lang}
                className="aspect-[4/3] [clip-path:polygon(0_0,100%_0,100%_calc(100%-28px),calc(100%-28px)_100%,0_100%)]"
                sizes="(min-width: 1024px) 400px, 100vw"
              />
            </div>
          </Figure>
        );
      case "quote":
        return (
          <blockquote
            key={index}
            className={`my-4 px-9 py-8 font-display text-[clamp(24px,2.8vw,34px)] leading-[1.15] font-bold text-bg uppercase [clip-path:polygon(0_0,calc(100%-32px)_0,100%_32px,100%_100%,0_100%)] ${BG[accent]}`}
          >
            <TranslatedText text={block.text} lang={lang} quoted />
          </blockquote>
        );
      case "facts":
        return (
          <dl key={index} className="my-2 grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-2.5">
            {block.facts.map((fact, factIndex) => (
              <div key={factIndex} className="flex flex-col-reverse gap-1.5 bg-surface p-4.5 font-mono">
                <dt className="text-[10px] tracking-[0.14em] text-fg-dim uppercase">
                  <TranslatedText text={fact.label} lang={lang} as="span" />
                </dt>
                <dd className={`text-[28px] leading-none font-bold ${TEXT[ACCENTS[factIndex % ACCENTS.length]]}`}>{fact.value}</dd>
              </div>
            ))}
          </dl>
        );
    }
  });
}

function Figure({ caption, lang, children }: { caption?: Translated; lang: Locale; children: ReactNode }) {
  return (
    <figure className="my-2 flex flex-col gap-2.5">
      {children}
      {caption && (
        <figcaption className="font-mono text-xs leading-normal tracking-[0.08em] text-fg-dim">
          <span aria-hidden>▸ </span>
          <TranslatedText text={caption} lang={lang} as="span" />
        </figcaption>
      )}
    </figure>
  );
}

/** The image, or a striped placeholder naming it until one is uploaded. */
function Picture({ image, lang, className, sizes }: { image: ReportImage; lang: Locale; className: string; sizes: string }) {
  const alt = pickTranslation(image.alt, lang)?.value ?? "";
  if (!image.src) {
    return (
      <div role="img" aria-label={alt} className={`${placeholder} ${className}`}>
        {alt}
      </div>
    );
  }
  return (
    <div className={`relative ${className}`}>
      <Image draggable={false} src={image.src} alt={alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}
