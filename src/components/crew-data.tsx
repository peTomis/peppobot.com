import Link from "next/link";
import type { CSSProperties } from "react";
import { tierOf } from "@/content/games";
import type { CrewReview, CrewStats } from "@/content/reviews";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { CrewReviewCard } from "./crew-review-card";
import { CrewReviewOpener } from "./crew-review-modal";
import { Radar } from "./radar";

type Strings = Dictionary["crew"];

/** Where the crew section's call to action leads, by who is looking. */
export type CrewAction =
  | { kind: "unreleased" }
  | { kind: "signIn"; href: string }
  | { kind: "chooseTag"; href: string }
  | { kind: "review"; href: string; tag: string; edit: boolean; accountHref: string };

const card = "[clip-path:polygon(0_0,calc(100%-28px)_0,100%_28px,100%_100%,0_100%)]";

const formatCount = (t: Strings, count: number) => (count === 1 ? t.oneReview : t.reviews.replace("{count}", String(count)));

/** The crew's averages as a radar, the latest reviews, and a link to review the game or to sign in. Rendered under the operator data. */
export function CrewData({
  stats,
  reviews,
  ownId,
  axisNames,
  allHref,
  action,
  lang,
  t,
}: {
  stats: CrewStats;
  reviews: CrewReview[];
  ownId: string | null;
  axisNames: string[];
  allHref: string;
  action: CrewAction;
  lang: Locale;
  t: Strings;
}) {
  const one = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const tier = stats.average != null ? tierOf(stats.average) : null;
  return (
    <section id="crew-data" aria-labelledby="crew-data-title" className={`flex scroll-mt-24 flex-col gap-4 bg-surface p-6 ${card}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="crew-data-title" className="font-display text-[22px] font-bold tracking-[0.06em] uppercase">
          {t.heading}
        </h2>
        <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-fg-dim">{formatCount(t, stats.count)}</span>
      </div>

      {stats.scores && stats.average != null ? (
        <>
          <div className="flex items-center gap-3">
            <span
              style={tier ? ({ "--c": tier.color } as CSSProperties) : undefined}
              className="hex flex h-15 w-17.5 shrink-0 flex-col items-center justify-center bg-(--c) font-mono font-bold text-bg"
            >
              <span className="text-[22px] leading-none">{one.format(stats.average)}</span>
            </span>
            <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-fg-muted">
              {t.average}
              {tier && <span className="block text-(--c)" style={{ "--c": tier.color } as CSSProperties}>{tier.label}</span>}
            </span>
          </div>
          <div className="py-6">
            <Radar values={stats.scores} labels={axisNames} format={one} color="var(--acc)" valueColor="var(--fg)" compact />
          </div>
        </>
      ) : (
        <p className="text-sm leading-normal text-fg-dim">{t.empty}</p>
      )}

      {reviews.length > 0 && (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id}>
              <CrewReviewOpener reviewId={review.id} tag={review.tag} lang={lang} t={t}>
                <CrewReviewCard review={review} own={review.id === ownId} lang={lang} t={t} compact />
              </CrewReviewOpener>
            </li>
          ))}
        </ul>
      )}

      {stats.count > reviews.length && (
        <Link href={allHref} className="self-start font-mono text-xs font-bold tracking-[0.12em] text-acc underline underline-offset-4 hover:no-underline">
          {t.seeAll} ({stats.count}) →
        </Link>
      )}

      <CrewCallToAction action={action} t={t} />
    </section>
  );
}

function CrewCallToAction({ action, t }: { action: CrewAction; t: Strings }) {
  const button = "block bg-acc px-4 py-3 text-center font-display text-sm font-bold tracking-[0.12em] text-bg uppercase [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,0_100%)] hover:bg-fg";
  switch (action.kind) {
    case "unreleased":
      return <p className="font-mono text-xs font-bold tracking-[0.08em] text-fg-dim">{t.unreleased}</p>;
    case "signIn":
      // A plain link: the sign-in route redirects to Google.
      return (
        <a href={action.href} className={button}>
          <span aria-hidden className="mr-2">G</span>
          {t.signIn}
        </a>
      );
    case "chooseTag":
      return (
        <Link href={action.href} className={button}>
          {t.chooseTag}
        </Link>
      );
    case "review":
      return (
        <div className="flex flex-col gap-2">
          <Link href={action.href} className={button}>
            {action.edit ? t.edit : t.write}
          </Link>
          <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-fg-dim">
            {t.signedInAs} <span className="text-fg">{action.tag}</span> ·{" "}
            <Link href={action.accountHref} className="underline underline-offset-4 hover:no-underline">
              {t.account}
            </Link>
          </span>
        </div>
      );
  }
}

/** Skeleton of the crew section while its data loads. */
export function CrewDataSkeleton({ t }: { t: Strings }) {
  return (
    <section aria-busy className={`flex flex-col gap-4 bg-surface p-6 ${card}`}>
      <span className="font-display text-[22px] font-bold tracking-[0.06em] uppercase">{t.heading}</span>
      <span className="sr-only">{t.loading}</span>
      <span aria-hidden className="hex mx-auto my-6 aspect-[1.15] w-1/2 animate-pulse bg-surface-hover" />
      <span aria-hidden className="h-11 animate-pulse bg-surface-hover" />
    </section>
  );
}

/** Link to a game's full list of crew reviews. */
export const crewReviewsHref = (lang: Locale, id: string) => localizePath(`/library/${encodeURIComponent(id)}/reviews`, lang);

/** Link to the review form of a game. */
export const crewReviewFormHref = (lang: Locale, id: string) => localizePath(`/library/${encodeURIComponent(id)}/review`, lang);
