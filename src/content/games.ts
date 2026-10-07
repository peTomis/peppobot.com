export type GameStatus = "Playing" | "Completed" | "Dropped";

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

export type Game = {
  id: string;
  title: string;
  dev: string;
  platform: Platform;
  genre: string;
  year: number;
  status: GameStatus;
  hours: number;
  /** Finish date, or last session while playing (YYYY-MM-DD). */
  finished: string;
  /** Completion percentage, only while playing. */
  progress?: number;
  scores: Scores;
  average: number;
};

export type LibraryStats = { count: number; hours: number; avgScore: number | null };
