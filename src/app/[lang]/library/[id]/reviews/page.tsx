import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CrewReviewCard } from "@/components/crew-data";
import { reportAxes } from "@/components/game-report";
import { gameHref } from "@/components/nav";
import { SectionHeading } from "@/components/section-heading";
import { localizePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/i18n/metadata";
import { getViewer } from "@/lib/auth";
import { getCrewReviews, getCrewStats, getOwnReview, getReviewTarget } from "@/lib/reviews";

const PAGE_SIZE = 20;

export async function generateMetadata({ params }: PageProps<"/[lang]/library/[id]/reviews">): Promise<Metadata> {
  const [{ id }, { crew }] = await Promise.all([params, getDictionary()]);
  return pageMetadata(`/library/${id}/reviews`, { title: crew.allTitle });
}

/** Every crew review of one game, most recent first, 20 per page (`?page=`). */
export default async function CrewReviewsPage({ params, searchParams }: PageProps<"/[lang]/library/[id]/reviews">) {
  const { crew: t } = await getDictionary();
  return (
    <main className="mx-auto flex w-full max-w-310 flex-1 flex-col gap-10 px-6 pt-10 pb-16">
      <SectionHeading id="crew-reports" index="00" first={t.allHeading[0]} second={t.allHeading[1]} accent="acc" />
      <Suspense fallback={<div aria-busy className="h-80 animate-pulse bg-surface" />}>
        <Reviews params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Reviews({ params, searchParams }: Pick<PageProps<"/[lang]/library/[id]/reviews">, "params" | "searchParams">) {
  const [{ id }, query, lang, dict, viewer] = await Promise.all([params, searchParams, getLocale(), getDictionary(), getViewer()]);
  const t = dict.crew;
  const game = await getReviewTarget(decodeURIComponent(id));
  if (!game) notFound();

  const stats = await getCrewStats(game.key);
  const pages = Math.max(1, Math.ceil(stats.count / PAGE_SIZE));
  const requested = Number(typeof query.page === "string" ? query.page : 1);
  const page = Number.isInteger(requested) ? Math.min(Math.max(1, requested), pages) : 1;
  const [reviews, own] = await Promise.all([getCrewReviews(game.key, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }), viewer ? getOwnReview(game.key, viewer.id) : null]);
  const axisNames = reportAxes(game, lang, dict.report.axes, dict.protocol.genreAxes).map((axis) => axis.name);
  const pageHref = (to: number) => `${localizePath(`/library/${encodeURIComponent(game.id)}/reviews`, lang)}${to > 1 ? `?page=${to}` : ""}`;
  const pager = "bg-surface px-4 py-2.5 font-mono text-xs font-bold tracking-[0.12em] text-fg uppercase hover:bg-surface-hover";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <Link href={`${gameHref(lang, game.id)}#crew-data`} className="font-display text-[clamp(24px,3vw,36px)] leading-[0.95] font-bold text-fg uppercase hover:text-acc">
          ← {game.title}
        </Link>
        <span className="font-mono text-xs font-bold tracking-[0.12em] text-fg-dim">{stats.count === 1 ? t.oneReview : t.reviews.replace("{count}", String(stats.count))}</span>
      </div>

      {reviews.length ? (
        <ul className="grid grid-cols-1 gap-4 desk:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id}>
              <CrewReviewCard review={review} own={review.id === own?.id} lang={lang} t={t} axisNames={axisNames} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-fg-dim">{t.empty}</p>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className={pager}>
              ← {t.previousPage}
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-xs font-bold tracking-[0.12em] text-fg-dim">{t.page.replace("{page}", String(page)).replace("{pages}", String(pages))}</span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className={pager}>
              {t.nextPage} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
