import type { CSSProperties } from "react";
import { tierOf } from "@/content/games";
import type { CrewReview } from "@/content/reviews";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { BoldText } from "./bold-text";

type Strings = Dictionary["crew"];

/** One crew review: tag, date, average and text. `compact` shows the first paragraph only, for the game page. With `axisNames`, also the six scores. */
export function CrewReviewCard({
  review,
  own,
  lang,
  t,
  compact = false,
  axisNames,
}: {
  review: CrewReview;
  own: boolean;
  lang: Locale;
  t: Strings;
  compact?: boolean;
  axisNames?: string[];
}) {
  const one = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const tier = tierOf(review.average);
  const date = new Intl.DateTimeFormat(lang, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(review.updatedAt);
  const blocks = compact ? review.blocks.slice(0, 1) : review.blocks;
  // Reviews are written in one language; mark it when it is not the page's.
  const textLang = review.lang !== lang ? review.lang : undefined;
  return (
    <article style={{ "--c": tier.color } as CSSProperties} className="flex flex-col gap-3 border-l-4 border-(--c) bg-bg/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-2 font-mono text-[13px] font-bold tracking-[0.06em] break-all text-fg">
            {review.tag}
            {own && <span className="bg-acc px-1.5 py-0.5 text-[10px] tracking-[0.12em] text-bg">{t.yours}</span>}
          </span>
          <time dateTime={new Date(review.updatedAt).toISOString()} className="font-mono text-[10px] tracking-[0.12em] text-fg-dim uppercase">
            {date}
          </time>
        </div>
        <span className="hex grid h-9 w-10.5 shrink-0 place-items-center bg-(--c) font-mono text-[13px] font-bold text-bg">{one.format(review.average)}</span>
      </div>

      {axisNames && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] font-bold desk:grid-cols-3">
          {review.scores.map((score, index) => (
            <div key={index} className="flex justify-between gap-2">
              <dt className="truncate tracking-[0.08em] text-fg-dim uppercase">{axisNames[index]}</dt>
              <dd>{one.format(score)}</dd>
            </div>
          ))}
        </dl>
      )}

      {blocks.map((block, index) => (
        // Visitors' text: bold only, no links, rendered as React text (never as HTML).
        <p key={index} lang={textLang} className={`text-[15px] leading-[1.6] break-words whitespace-pre-line text-fg-soft ${compact ? "line-clamp-5" : ""}`}>
          <BoldText text={block.text} links={false} />
        </p>
      ))}
      {compact && review.blocks.length > 1 && <span className="font-mono text-[10px] tracking-[0.12em] text-fg-dim">+{review.blocks.length - 1} ¶</span>}
    </article>
  );
}
