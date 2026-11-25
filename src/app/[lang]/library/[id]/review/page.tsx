import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { reportAxes } from "@/components/game-report";
import { gameHref } from "@/components/nav";
import { ReviewForm } from "@/components/review-form";
import { SectionHeading } from "@/components/section-heading";
import { localizePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/i18n/metadata";
import { getViewer } from "@/lib/auth";
import { getOwnReview, getReviewTarget } from "@/lib/reviews";

export async function generateMetadata({ params }: PageProps<"/[lang]/library/[id]/review">): Promise<Metadata> {
  const [{ id }, { reviewForm }] = await Promise.all([params, getDictionary()]);
  // A form behind sign-in: kept out of search engines.
  return { ...(await pageMetadata(`/library/${id}/review`, { title: reviewForm.title })), robots: { index: false, follow: false } };
}

/** The visitor's crew review of one game. Signed-out visitors go to Google first, visitors without a tag to their account. */
export default async function ReviewPage({ params }: PageProps<"/[lang]/library/[id]/review">) {
  const { reviewForm: t } = await getDictionary();
  return (
    <main className="mx-auto flex w-full max-w-310 flex-1 flex-col gap-10 px-6 pt-10 pb-16">
      <SectionHeading id="your-report" index="00" first={t.heading[0]} second={t.heading[1]} accent="acc" />
      <Suspense fallback={<div aria-busy className="h-120 animate-pulse bg-surface" />}>
        <Review params={params} />
      </Suspense>
    </main>
  );
}

async function Review({ params }: { params: PageProps<"/[lang]/library/[id]/review">["params"] }) {
  const [{ id }, lang, dict] = await Promise.all([params, getLocale(), getDictionary()]);
  const slug = decodeURIComponent(id);
  const here = localizePath(`/library/${encodeURIComponent(slug)}/review`, lang);
  const viewer = await getViewer();
  if (!viewer) redirect(`/api/auth/google?next=${encodeURIComponent(here)}`);
  if (!viewer.tag) redirect(`${localizePath("/account", lang)}?next=${encodeURIComponent(here)}`);

  const game = await getReviewTarget(slug);
  if (!game) notFound();
  const back = gameHref(lang, game.id);
  if (!game.released) redirect(back);
  const own = await getOwnReview(game.key, viewer.id);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <a href={back} className="font-display text-[clamp(28px,3.4vw,44px)] leading-[0.95] font-bold text-fg uppercase hover:text-acc">
          {game.title}
        </a>
        <p className="max-w-[70ch] text-base leading-[1.6] text-fg-dim">{dict.reviewForm.intro}</p>
      </div>
      <ReviewForm
        game={game.id}
        lang={lang}
        axes={reportAxes(game, lang, dict.report.axes, dict.protocol.genreAxes)}
        // A new review starts in the middle of the scale.
        initialScores={own?.scores ?? [5, 5, 5, 5, 5, 5]}
        initialParagraphs={own ? own.blocks.map((block) => block.text) : [""]}
        editing={own != null}
        cancelHref={`${back}#crew-data`}
        t={dict.reviewForm}
      />
    </div>
  );
}
