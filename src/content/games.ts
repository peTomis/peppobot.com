import type { Translated } from "@/i18n/translations";

export const STATUSES = ["Playing", "Completed", "Dropped", "Not Started"] as const;

export type GameStatus = (typeof STATUSES)[number];

/** Accent per status: card bars, list borders, status tags. */
export const STATUS_COLORS: Record<GameStatus, string> = {
  Playing: "var(--acc)",
  Completed: "var(--acc2)",
  Dropped: "#ff5c7a",
  "Not Started": "var(--fg-dim)",
};

/** Library orderings, in the order the sort controls show them. */
export const LIBRARY_SORTS = ["recent", "score", "hours", "az"] as const;

export type LibrarySort = (typeof LIBRARY_SORTS)[number];

export type LibraryQuery = { q: string; status: GameStatus | null; sort: LibrarySort; page: number };

/** `offset` is the position of the first game on this page within all matches. */
export type LibraryPage = { games: Game[]; matches: number; total: number; page: number; pages: number; offset: number };

/** `logo.file` is in `public/icons`, cropped to the drawing; `ratio` is its width / height. */
export const PLATFORMS = {
  1: { id: 1, name: "Steam", logo: { file: "steam", ratio: 1 } },
  2: { id: 2, name: "Epic Games", logo: { file: "epicgames", ratio: 1 } },
  3: { id: 3, name: "Ea Play", logo: { file: "ea", ratio: 1 } },
  4: { id: 4, name: "Ubisoft Connect", logo: { file: "ubisoft", ratio: 1 } },
  5: { id: 5, name: "Switch 2", logo: { file: "nintendo-switch-2", ratio: 1.85 } },
  6: { id: 6, name: "Switch 1", logo: { file: "nintendo-switch", ratio: 1 } },
  7: { id: 7, name: "PS5", logo: { file: "ps5", ratio: 4.35 } },
  8: { id: 8, name: "PS4", logo: { file: "ps4", ratio: 4.37 } },
  9: { id: 9, name: "Xbox Series X", logo: { file: "xbox-series", ratio: 2.22 } },
  10: { id: 10, name: "Xbox One", logo: { file: "xbox-one", ratio: 5.57 } },
  11: { id: 11, name: "iOS", logo: { file: "ios", ratio: 1 } },
  12: { id: 12, name: "Android", logo: { file: "android", ratio: 1 } },
  13: { id: 13, name: "Other", logo: null },
} as const;

export type Platform = keyof typeof PLATFORMS;

/** Stored on games by id, like platforms; the name is the same in every language. */
export const GENRES = {
  1: { id: 1, name: "RPG" },
  2: { id: 2, name: "JRPG" },
  3: { id: 3, name: "ARPG" },
  4: { id: 4, name: "MMORPG" },
} as const;

export type Genre = keyof typeof GENRES;

/** Genres in alphabetical order, for lists that show every genre. */
export const GENRES_BY_NAME = Object.values(GENRES).sort((a, b) => a.name.localeCompare(b.name));

/** 0–10 scores, in the order of `AXES`. */
export type Scores = [number, number, number, number, number, number];

/** The genre axes are scored on the criteria of the game's genre; the signature on what only that game does. */
export const AXES = ["Gameplay", "Visuals", "Audio", "Genre I", "Genre II", "Signature"] as const;

/** Score bands, highest first; a game falls in the first tier whose `min` it reaches. */
export const TIERS = [
  { min: 9, label: "OVERCLOCKED", color: "var(--acc)" },
  { min: 8, label: "OPTIMAL", color: "#a8ff5c" },
  { min: 7, label: "STABLE", color: "var(--acc2)" },
  { min: 5, label: "GLITCHED", color: "#ff8a5c" },
  { min: 0, label: "CORRUPTED", color: "#ff5c7a" },
] as const;

export const tierOf = (score: number) => TIERS.find((tier) => score >= tier.min) ?? TIERS[TIERS.length - 1];

/** An image in a report; without `src` a striped placeholder shows the `alt` text. */
export type ReportImage = { src?: string; alt: Translated };

/** One piece of a written report, rendered in order. Blocks without `accent` take the next accent in turn. */
export type ReportBlock =
  | { type: "heading"; text: Translated; accent?: Accent }
  | { type: "paragraph"; text: Translated }
  | { type: "image"; image: ReportImage; caption?: Translated; accent?: Accent }
  | { type: "pair"; images: [ReportImage, ReportImage]; caption?: Translated }
  | { type: "quote"; text: Translated; accent?: Accent }
  | { type: "facts"; facts: { label: Translated; value: string }[] };

export type Accent = "acc" | "acc2" | "acc3";

export type Game = {
  id: string;
  title: string;
  dev: string;
  platform: Platform;
  genre: Genre;
  /** Release date, as a Unix timestamp in milliseconds; null while unannounced. */
  releasedOn: number | null;
  status: GameStatus;
  hours: number;
  /** When the run ended, as a Unix timestamp in milliseconds; only for Completed or Dropped, null otherwise. */
  finishedOn: number | null;
  /** Completion percentage; null until the run has started. */
  progress: number | null;
  /** Cover art URL; null shows the striped placeholder. */
  cover: string | null;
  /** Peppobot's take on the game, shown on cards and as the report's headline. */
  description: Translated;
  /** Only for finished runs (Completed or Dropped), null otherwise; only loaded on the game page. */
  pros: Translated[] | null;
  /** Only for finished runs (Completed or Dropped), null otherwise; only loaded on the game page. */
  cons: Translated[] | null;
  /** The written report, also while playing (a provisional report); null when missing. Only loaded on the game page. */
  blocks: ReportBlock[] | null;
  /** What only this game does, scored on the Signature axis. Expected on finished runs (Completed or Dropped), optional otherwise; null when missing. Only loaded on the game page. */
  signature: Translated | null;
  /** Only for finished runs (Completed or Dropped); null while playing. */
  scores: Scores | null;
  /** Only for finished runs (Completed or Dropped); null while playing. */
  average: number | null;
};

/** A game as stored: optional fields may be missing, and fields that do not apply to the status may still be set. */
export type GameFields = Omit<Game, "id" | "pros" | "cons" | "signature" | "blocks" | "cover"> & Partial<Pick<Game, "id" | "pros" | "cons" | "signature" | "blocks" | "cover">>;

/** The game as pages show it; `fallbackId` is used when the game has no `id` of its own. */
export function normalizeGame(game: GameFields, fallbackId: string): Game {
  // Only ended runs have a score, an end date, pros and cons, whatever the document holds.
  const ended = game.status === "Completed" || game.status === "Dropped";
  return {
    ...game,
    id: game.id || fallbackId,
    finishedOn: ended ? (game.finishedOn ?? null) : null,
    progress: game.status === "Not Started" ? null : (game.progress ?? null),
    scores: ended ? game.scores : null,
    average: ended ? game.average : null,
    pros: ended ? (game.pros ?? null) : null,
    cons: ended ? (game.cons ?? null) : null,
    description: game.description ?? [],
    cover: game.cover ?? null,
    signature: game.signature ?? null,
    blocks: game.blocks?.length ? game.blocks : null,
  };
}

/** Release year, read in UTC so a New Year's Day release never shifts a year. */
export const releaseYear = (game: Pick<Game, "releasedOn">) => (game.releasedOn != null ? new Date(game.releasedOn).getUTCFullYear() : null);


export type ReportLink = { id: string; title: string };

/** A game with its report number (order of logging) and its neighbours in the library's default order. */
export type GameReport = { game: Game; number: number; prev: ReportLink | null; next: ReportLink | null };
