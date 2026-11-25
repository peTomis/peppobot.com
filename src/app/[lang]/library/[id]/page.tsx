import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache, Suspense } from "react";
import { CrewData, CrewDataSkeleton, crewReviewFormHref, crewReviewsHref, type CrewAction } from "@/components/crew-data";
import { GameReport, GameReportSkeleton, reportAxes } from "@/components/game-report";
import type { GameReport as GameReportData } from "@/content/games";
import { localizePath, type Locale } from "@/i18n/config";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { pageMetadata } from "@/i18n/metadata";
import { pickTranslation } from "@/i18n/translations";
import { getViewer } from "@/lib/auth";
import { getGameReport } from "@/lib/games";
import { getCrewReviews, getCrewStats, getOwnReview, getReviewTarget } from "@/lib/reviews";

// Metadata and page share one lookup per request.
const loadReport = cache(async (id: string) => {
  // MongoDB's driver reads the clock; defer its work until a request arrives.
  await connection();
  return getGameReport(decodeURIComponent(id));
});

export async function generateMetadata({ params }: PageProps<"/[lang]/library/[id]">): Promise<Metadata> {
  const [{ id }, lang] = await Promise.all([params, getLocale()]);
  const report = await loadReport(id);
  if (!report) return {};
  const description = pickTranslation(report.game.description, lang)?.value;
  // Canonical on the slug, also when the page is reached by `_id`.
  return pageMetadata(`/library/${encodeURIComponent(report.game.id)}`, { title: report.game.title, description, image: report.game.cover });
}

// The skeleton is prerendered; the report streams in once the game is loaded.
export default async function GamePage({ params }: PageProps<"/[lang]/library/[id]">) {
  const { report: t } = await getDictionary();
  return (
    <main className="w-full px-6 pt-10 pb-16 mx-auto flex-1 max-w-310">
      <Suspense fallback={<GameReportSkeleton t={t} />}>
        <Report params={params} />
      </Suspense>
    </main>
  );
}

async function Report({ params }: { params: PageProps<"/[lang]/library/[id]">["params"] }) {
  const [{ id }, lang, dict] = await Promise.all([params, getLocale(), getDictionary()]);
  const report = await loadReport(id);
  if (!report) notFound();
  const crew = (
    // The crew section reads the visitor's session, so it streams in on its own.
    <Suspense fallback={<CrewDataSkeleton t={dict.crew} />}>
      <Crew report={report} lang={lang} dict={dict} />
    </Suspense>
  );
  return <GameReport report={report} lang={lang} t={dict.report} statuses={dict.library.statuses} genreAxes={dict.protocol.genreAxes} crew={crew} />;
}

/** Crew averages, the two latest crew reviews and what the visitor can do: sign in, choose a tag, or write or edit their review. */
async function Crew({ report, lang, dict }: { report: GameReportData; lang: Locale; dict: Dictionary }) {
  const { game } = report;
  let loaded;
  try {
    const [viewer, target] = await Promise.all([getViewer(), getReviewTarget(game.id)]);
    if (!target) return null;
    const [stats, reviews, own] = await Promise.all([
      getCrewStats(target.key),
      getCrewReviews(target.key, { limit: 2 }),
      viewer ? getOwnReview(target.key, viewer.id) : null,
    ]);
    loaded = { viewer, target, stats, reviews, own };
  } catch (error) {
    // The report stays up when the crew collections cannot be read.
    console.error("Crew data unavailable:", error);
    return null;
  }
  const { viewer, target, stats, reviews, own } = loaded;

  const formHref = crewReviewFormHref(lang, game.id);
  const action: CrewAction = !target.released
    ? { kind: "unreleased" }
    : !viewer
      ? { kind: "signIn", href: `/api/auth/google?next=${encodeURIComponent(formHref)}` }
      : !viewer.tag
        ? { kind: "chooseTag", href: `${localizePath("/account", lang)}?next=${encodeURIComponent(formHref)}` }
        : { kind: "review", href: formHref, tag: viewer.tag, edit: own != null, accountHref: localizePath("/account", lang) };

  return (
    <CrewData
      stats={stats}
      reviews={reviews}
      ownId={own?.id ?? null}
      axisNames={reportAxes(game, lang, dict.report.axes, dict.protocol.genreAxes).map((axis) => axis.name)}
      allHref={crewReviewsHref(lang, game.id)}
      action={action}
      lang={lang}
      t={dict.crew}
    />
  );
}
