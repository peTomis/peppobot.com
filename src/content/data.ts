import type { Genre, Platform } from "./games";

/**
 * Site-wide figures, precomputed from the games and stored as the single document of the `data`
 * collection. Score figures (`avgScore`, `axes`, `tiers`, genre averages) count completed games only.
 */
export type Data = {
  count: number;
  hours: number;
  avgScore: number | null;
  completed: number;
  /** Average per score axis, in the order of `AXES`; null with no completed game. */
  axes: (number | null)[];
  /** Completed games per tier, in the order of `TIERS`. */
  tiers: number[];
  /** Hours across all games, by platform, most played first. */
  platformHours: { platform: Platform; hours: number }[];
  /** Completed games by genre, best average first. */
  genres: { genre: Genre; count: number; avgScore: number }[];
};
