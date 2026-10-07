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

export const PLATFORMS = {
  1: { id: 1, name: "Steam" },
  2: { id: 2, name: "Epic Games" },
  3: { id: 3, name: "Ea Play" },
  4: { id: 4, name: "Ubisoft Connect" },
  5: { id: 5, name: "Switch 2" },
  6: { id: 6, name: "Switch 1" },
  7: { id: 7, name: "PS5" },
  8: { id: 8, name: "PS4" },
  9: { id: 9, name: "Xbox Series X" },
  10: { id: 10, name: "Xbox One" },
  11: { id: 11, name: "iOS" },
  12: { id: 12, name: "Android" },
  13: { id: 13, name: "Other" },
} as const;

export type Platform = keyof typeof PLATFORMS;

/** 0–10 scores, in the order of `AXES`. */
export type Scores = [number, number, number, number, number, number];

export const AXES = ["Gameplay", "Narrative", "Visuals", "Audio", "Longevity", "Innovation"] as const;

/** Score bands, highest first; a game falls in the first tier whose `min` it reaches. */
export const TIERS = [
  { min: 9, label: "OVERCLOCKED", color: "var(--acc)" },
  { min: 8, label: "OPTIMAL", color: "#a8ff5c" },
  { min: 7, label: "STABLE", color: "var(--acc2)" },
  { min: 5, label: "GLITCHED", color: "#ff8a5c" },
  { min: 0, label: "CORRUPTED", color: "#ff5c7a" },
] as const;

export const tierOf = (score: number) => TIERS.find((tier) => score >= tier.min) ?? TIERS[TIERS.length - 1];

export type Game = {
  id: string;
  title: string;
  dev: string;
  platform: Platform;
  genre: string;
  /** Release date, as a Unix timestamp in milliseconds; null while unannounced. */
  releasedOn: number | null;
  status: GameStatus;
  hours: number;
  /** When the run ended, as a Unix timestamp in milliseconds; only for Completed or Dropped, null otherwise. */
  finishedOn: number | null;
  /** Completion percentage; null until the run has started. */
  progress: number | null;
  /** Peppobot's take on the game, shown on cards and as the report's headline. */
  description: Translated;
  /** Only for finished runs (Completed or Dropped), null otherwise; only loaded on the game page. */
  pros: Translated[] | null;
  /** Only for finished runs (Completed or Dropped), null otherwise; only loaded on the game page. */
  cons: Translated[] | null;
  /** Only for finished runs (Completed or Dropped); null while playing. */
  scores: Scores | null;
  /** Only for finished runs (Completed or Dropped); null while playing. */
  average: number | null;
};

/** Release year, read in UTC so a New Year's Day release never shifts a year. */
export const releaseYear = (game: Pick<Game, "releasedOn">) => (game.releasedOn != null ? new Date(game.releasedOn).getUTCFullYear() : null);

export type LibraryStats = { count: number; hours: number; avgScore: number | null };

export type ReportLink = { id: string; title: string };

/** A game with its report number (order of logging) and its neighbours in the library's default order. */
export type GameReport = { game: Game; number: number; prev: ReportLink | null; next: ReportLink | null };
