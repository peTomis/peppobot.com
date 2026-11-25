"use server";

import { redirect } from "next/navigation";
import type { Scores } from "@/content/games";
import { averageOf, REVIEW_LIMITS, sanitizeReviewText, SCORE_STEP, visibleLength, type CrewBlock } from "@/content/reviews";
import { defaultLocale, hasLocale, type Locale } from "@/i18n/config";
import { gameHref } from "@/components/nav";
import { getViewer } from "@/lib/auth";
import { deleteReview, getReviewTarget, saveReview } from "@/lib/reviews";

export type ReviewError = "signedOut" | "noTag" | "notFound" | "unreleased" | "scores" | "tooMany" | "tooLong";
export type ReviewState = { error: ReviewError | null };

/** The signed-in visitor with a tag and the game they act on, or the reason they cannot. */
async function authorize(formData: FormData) {
  const lang: Locale = ((value) => (hasLocale(value) ? value : defaultLocale))(String(formData.get("lang") ?? ""));
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "signedOut" } as const;
  if (!viewer.tag) return { ok: false, error: "noTag" } as const;
  const game = await getReviewTarget(String(formData.get("game") ?? "").slice(0, 100));
  if (!game) return { ok: false, error: "notFound" } as const;
  return { ok: true, viewer, game, lang } as const;
}

/** Creates or replaces the visitor's review of a game: a six-axis hexagon and up to a few paragraphs. */
export async function saveReviewAction(_state: ReviewState, formData: FormData): Promise<ReviewState> {
  const context = await authorize(formData);
  if (!context.ok) return { error: context.error };
  const { viewer, game, lang } = context;
  if (!game.released) return { error: "unreleased" };

  const fields = [0, 1, 2, 3, 4, 5].map((axis) => formData.get(`score${axis}`));
  if (fields.some((field) => typeof field !== "string" || !/^\d{1,2}(\.\d)?$/.test(field))) return { error: "scores" };
  const scores = fields.map(Number);
  if (scores.some((score) => score < 0 || score > 10 || !Number.isInteger(score / SCORE_STEP))) return { error: "scores" };

  // Every paragraph is cleaned on the server, whatever the form sent.
  const paragraphs = formData.getAll("paragraph");
  if (paragraphs.length > REVIEW_LIMITS.paragraphs * 2) return { error: "tooMany" };
  const blocks: CrewBlock[] = paragraphs
    .map((value) => sanitizeReviewText(typeof value === "string" ? value.slice(0, REVIEW_LIMITS.paragraphLength * 4) : ""))
    .filter(Boolean)
    .map((text) => ({ type: "paragraph", text }));
  if (blocks.length > REVIEW_LIMITS.paragraphs) return { error: "tooMany" };
  if (blocks.some((block) => visibleLength(block.text) > REVIEW_LIMITS.paragraphLength)) return { error: "tooLong" };

  await saveReview(game.key, viewer.id, { scores: scores as Scores, average: averageOf(scores), blocks, lang });
  redirect(`${gameHref(lang, game.id)}#crew-data`);
}

/** Deletes the visitor's own review of a game. */
export async function deleteReviewAction(_state: ReviewState, formData: FormData): Promise<ReviewState> {
  const context = await authorize(formData);
  if (!context.ok) return { error: context.error };
  await deleteReview(context.game.key, context.viewer.id);
  redirect(`${gameHref(context.lang, context.game.id)}#crew-data`);
}
