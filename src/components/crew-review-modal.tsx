"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { tierOf } from "@/content/games";
import type { CrewReview } from "@/content/reviews";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { BoldText } from "./bold-text";
import { gameHref } from "./nav";
import { Radar } from "./radar";

type Strings = Dictionary["crew"];

/** A review as `/api/reviews/[id]` sends it: with its game and the names of its axes. */
type ThreadReview = CrewReview & { game: { id: string; title: string }; axes: string[] };
type Thread = { review: ThreadReview; others: ThreadReview[] };

/**
 * Makes a review card open a modal with that review in full, then every other review by the same
 * author. The thread is loaded on every open. Uses a native `<dialog>`: focus, Escape and the inert page come with it.
 */
export function CrewReviewOpener({ reviewId, tag, lang, t, children }: { reviewId: string; tag: string; lang: Locale; t: Strings; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [thread, setThread] = useState<Thread | "loading" | "error" | null>(null);

  const load = async () => {
    // A thread already shown stays on screen while the fresh one loads.
    setThread((current) => (current && current !== "error" ? current : "loading"));
    try {
      const response = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}?lang=${lang}`, { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      setThread((await response.json()) as Thread);
    } catch {
      setThread("error");
    }
  };

  const open = () => {
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
    // Reloaded on every open, so edits made since show up.
    void load();
  };
  const close = () => dialog.current?.close();

  return (
    <div className="relative">
      {children}
      {/* Covers the card: the whole card opens the modal. */}
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label={t.openReview.replace("{tag}", tag)}
        className="absolute inset-0 cursor-pointer outline-offset-2 hover:bg-fg/4 focus-visible:outline-2 focus-visible:outline-acc"
      />
      <dialog
        ref={dialog}
        aria-label={t.modalTitle}
        onClose={() => (document.body.style.overflow = "")}
        // A click on the backdrop (the dialog itself, outside its content) closes it.
        onClick={(event) => event.target === dialog.current && close()}
        className="m-auto max-h-[calc(100dvh-48px)] w-[min(720px,calc(100%-32px))] overflow-y-auto border-2 border-acc2 bg-bg p-0 text-fg backdrop:bg-black/70"
      >
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-xs font-bold tracking-[0.16em] text-acc uppercase">
              {t.modalTitle} · <span className="text-fg">{tag}</span>
            </h2>
            <button type="button" onClick={close} aria-label={t.close} className="grid size-11 shrink-0 cursor-pointer place-items-center text-fg-dim hover:text-acc">
              <svg viewBox="0 0 24 24" aria-hidden className="size-5.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="square">
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
          </div>

          {thread === "loading" || thread === null ? (
            <div aria-busy className="flex justify-center py-10">
              <span className="sr-only">{t.loading}</span>
              <span aria-hidden className="hex h-10 w-11.5 animate-[spin_1.4s_linear_infinite] bg-acc2" />
            </div>
          ) : thread === "error" ? (
            <p role="alert" className="bg-acc3 px-4 py-3 font-mono text-sm font-bold text-bg">
              {t.loadError}
            </p>
          ) : (
            <>
              <ThreadEntry review={thread.review} lang={lang} onNavigate={close} />
              <section className="flex flex-col gap-4 border-t border-line pt-6">
                <h3 className="font-display text-[22px] font-bold tracking-[0.06em] uppercase">
                  {t.otherReviews.replace("{tag}", thread.review.tag)} <span className="font-mono text-sm text-fg-dim">({thread.others.length})</span>
                </h3>
                {thread.others.length ? (
                  <ul className="flex flex-col gap-5">
                    {thread.others.map((review) => (
                      <li key={review.id}>
                        <ThreadEntry review={review} lang={lang} onNavigate={close} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-fg-dim">{t.noOthers.replace("{tag}", thread.review.tag)}</p>
                )}
              </section>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}

/** A review in the modal, as a card like the operator data: the game on top (opens its page), the average top right, the review's hexagon beside its text, the date bottom right. */
function ThreadEntry({ review, lang, onNavigate }: { review: ThreadReview; lang: Locale; onNavigate: () => void }) {
  const one = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const tier = tierOf(review.average);
  const date = new Intl.DateTimeFormat(lang, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(review.updatedAt);
  return (
    <article
      // Bold text in the card is dark, like the rest of its text.
      style={{ "--report-bold": "var(--bg)" } as CSSProperties}
      className="flex flex-col gap-4 bg-acc2 p-7 text-bg [clip-path:polygon(28px_0,100%_0,100%_100%,0_100%,0_28px)]"
    >
      <div className="flex items-start justify-between gap-4">
        <Link
          href={`${gameHref(lang, review.game.id)}#crew-data`}
          onClick={onNavigate}
          className="min-w-0 font-display text-[22px] leading-tight font-bold tracking-[0.06em] uppercase hover:text-fg"
        >
          {review.game.title}
        </Link>
        <span style={{ background: tier.color }} className="hex grid h-11 w-12.5 shrink-0 place-items-center font-mono text-base font-bold text-bg">
          {one.format(review.average)}
        </span>
      </div>
      {/* Hexagon and text side by side; stacked on phones. */}
      <div className="flex flex-col items-start gap-6 desk:flex-row">
        <div className="mx-auto w-full max-w-80 shrink-0 py-5 desk:mx-0 desk:w-60">
          <Radar values={review.scores} labels={review.axes} format={one} color="var(--acc)" valueColor="var(--bg)" labelColor="var(--bg)" compact />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {review.blocks.map((block, index) => (
            // Visitors' text: bold only, no links, rendered as React text (never as HTML).
            <p key={index} lang={review.lang !== lang ? review.lang : undefined} className="text-[15px] leading-[1.6] font-medium break-words whitespace-pre-line">
              <BoldText text={block.text} links={false} />
            </p>
          ))}
        </div>
      </div>
      <time dateTime={new Date(review.updatedAt).toISOString()} className="self-end font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
        {date}
      </time>
    </article>
  );
}
