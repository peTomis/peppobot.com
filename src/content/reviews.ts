import type { Scores } from "@/content/games";

/** Shared by the site's server code and the review form, so the form's checks match the server's. */

/** A crew tag: 3–20 letters, digits, `_` or `-`, starting with a letter or digit. Unique regardless of case. */
export const TAG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,19}$/;

/** Tags nobody can take, compared in lower case; any tag containing "peppobot" is also refused. */
const RESERVED_TAGS = new Set(["admin", "administrator", "moderator", "mod", "staff", "support", "system", "root", "null", "undefined", "operator", "pilot", "crew", "anonymous"]);

export type TagError = "invalid" | "reserved" | "taken";

/** Why a tag cannot be used, before checking whether someone else has it; null when it can. */
export function checkTag(tag: string): Exclude<TagError, "taken"> | null {
  if (!TAG_PATTERN.test(tag)) return "invalid";
  const key = tag.toLowerCase();
  if (RESERVED_TAGS.has(key) || key.includes("peppobot")) return "reserved";
  return null;
}

/** Limits on a crew review's written part. */
export const REVIEW_LIMITS = { paragraphs: 8, paragraphLength: 1500 } as const;

/** Scores go from 0 to 10 in steps of `SCORE_STEP`. */
export const SCORE_STEP = 0.5;

/** A paragraph of a crew review: plain text whose only markup is non-nested `<b>…</b>`, as left by `sanitizeReviewText`. */
export type CrewBlock = { type: "paragraph"; text: string };

export type CrewReview = {
  id: string;
  /** The author's crew tag, as it is now. */
  tag: string;
  scores: Scores;
  average: number;
  blocks: CrewBlock[];
  /** Language the review was written in. */
  lang: string;
  /** Unix timestamps in milliseconds. */
  createdAt: number;
  updatedAt: number;
};

/** The crew's averages for one game: per axis and overall, one decimal; null while nobody has reviewed it. */
export type CrewStats = { count: number; scores: Scores | null; average: number | null };

/** Average of six scores, to one decimal. */
export const averageOf = (scores: readonly number[]) => Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10;

// Control characters (except tab and newline), zero-width characters and bidirectional overrides.
const UNSAFE_CHARACTERS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u2069\uFEFF]/g;
// Anything that looks like an HTML tag, comment, doctype or processing instruction.
const TAG_LIKE = /<\/?[a-z!?][^<>]*>?/gi;

/**
 * Cleans a paragraph written by a visitor. The result is plain text whose only markup is
 * balanced, non-nested `<b>…</b>` pairs (`<strong>` becomes `<b>`, attributes are dropped);
 * every other tag-like sequence is removed. Pages render it with `BoldText` without links,
 * as React text nodes, never through `innerHTML`, so this is a second line of defence.
 */
export function sanitizeReviewText(input: string): string {
  // Repeat until stable, so removed pieces can never join into a new tag (`<scr<b>ipt>`).
  let text = input;
  for (let pass = 0; pass < 5; pass++) {
    const next = sanitizeOnce(text);
    if (next === text) break;
    text = next;
  }
  return text;
}

function sanitizeOnce(input: string): string {
  const text = input.normalize("NFC").replace(/\r\n?/g, "\n").replace(/\t/g, " ").replace(UNSAFE_CHARACTERS, "");
  let output = "";
  let bold = false;
  let last = 0;
  for (const match of text.matchAll(TAG_LIKE)) {
    output += text.slice(last, match.index);
    last = match.index + match[0].length;
    const tag = /^<(\/?)(?:b|strong)(?:\s[^<>]*)?>$/i.exec(match[0]);
    if (!tag) continue;
    if (!tag[1] && !bold) {
      output += "<b>";
      bold = true;
    } else if (tag[1] && bold) {
      output += "</b>";
      bold = false;
    }
  }
  output += text.slice(last);
  if (bold) output += "</b>";
  return output
    .replace(/<b>(\s*)<\/b>/g, "$1")
    .replace(/[ \u00A0]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Length a visitor sees: the text without its bold tags. */
export const visibleLength = (text: string) => text.replace(/<\/?b>/g, "").length;
