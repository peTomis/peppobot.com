export type GameStatus = "Playing" | "Completed" | "Dropped";

/** 0–10 scores, in the order of `AXES`. */
export type Scores = [number, number, number, number, number, number];

export const AXES = ["Gameplay", "Narrative", "Visuals", "Audio", "Longevity", "Innovation"] as const;

export type Game = {
  id: string;
  title: string;
  dev: string;
  platform: string;
  genre: string;
  year: number;
  status: GameStatus;
  hours: number;
  /** Finish date, or last session while playing (YYYY-MM-DD). */
  finished: string;
  /** Completion percentage, only while playing. */
  progress?: number;
  scores: Scores;
};

// Seed data from the Claude Design prototype — replace with the real log.
export const GAMES: Game[] = [
  { id: "mp4", title: "Metroid Prime 4: Beyond", dev: "Retro Studios", platform: "Switch 2", genre: "Action-Adventure", year: 2025, status: "Playing", hours: 9, finished: "2026-10-01", progress: 35, scores: [8, 6, 9, 9, 7, 7] },
  { id: "yotei", title: "Ghost of Yōtei", dev: "Sucker Punch", platform: "PS5", genre: "Action", year: 2025, status: "Playing", hours: 28, finished: "2026-09-20", progress: 60, scores: [8, 8, 10, 9, 8, 6] },
  { id: "hades2", title: "Hades II", dev: "Supergiant Games", platform: "PC", genre: "Roguelike", year: 2025, status: "Completed", hours: 71, finished: "2026-03-12", scores: [10, 8, 9, 10, 10, 8] },
  { id: "silksong", title: "Hollow Knight: Silksong", dev: "Team Cherry", platform: "Switch 2", genre: "Metroidvania", year: 2025, status: "Completed", hours: 48, finished: "2026-01-18", scores: [10, 7, 9, 10, 9, 8] },
  { id: "mafia", title: "Mafia: The Old Country", dev: "Hangar 13", platform: "PC", genre: "Action", year: 2025, status: "Dropped", hours: 6, finished: "2025-09-02", scores: [6, 7, 8, 7, 4, 4] },
  { id: "ds2", title: "Death Stranding 2", dev: "Kojima Productions", platform: "PS5", genre: "Action", year: 2025, status: "Completed", hours: 55, finished: "2025-08-02", scores: [8, 8, 10, 9, 7, 9] },
  { id: "clair", title: "Clair Obscur: Expedition 33", dev: "Sandfall Interactive", platform: "PS5", genre: "RPG", year: 2025, status: "Completed", hours: 62, finished: "2025-06-14", scores: [9, 10, 10, 10, 8, 9] },
  { id: "doom", title: "DOOM: The Dark Ages", dev: "id Software", platform: "PC", genre: "FPS", year: 2025, status: "Completed", hours: 19, finished: "2025-05-25", scores: [9, 5, 8, 9, 6, 7] },
  { id: "kcd2", title: "Kingdom Come: Deliverance II", dev: "Warhorse Studios", platform: "PC", genre: "RPG", year: 2025, status: "Completed", hours: 110, finished: "2025-04-10", scores: [8, 9, 9, 8, 9, 7] },
  { id: "split", title: "Split Fiction", dev: "Hazelight", platform: "PS5", genre: "Co-op", year: 2025, status: "Completed", hours: 15, finished: "2025-03-22", scores: [9, 6, 9, 8, 5, 9] },
  { id: "balatro", title: "Balatro", dev: "LocalThunk", platform: "Switch", genre: "Roguelike", year: 2024, status: "Completed", hours: 140, finished: "2024-12-01", scores: [10, 3, 7, 8, 10, 10] },
  { id: "astro", title: "Astro Bot", dev: "Team Asobi", platform: "PS5", genre: "Platformer", year: 2024, status: "Completed", hours: 16, finished: "2024-10-05", scores: [10, 5, 9, 9, 7, 9] },
  { id: "ff7r", title: "Final Fantasy VII Rebirth", dev: "Square Enix", platform: "PS5", genre: "RPG", year: 2024, status: "Completed", hours: 95, finished: "2024-08-20", scores: [9, 9, 9, 10, 9, 7] },
  { id: "bg3", title: "Baldur's Gate 3", dev: "Larian Studios", platform: "PC", genre: "RPG", year: 2023, status: "Completed", hours: 160, finished: "2024-02-11", scores: [9, 10, 8, 9, 10, 9] },
  { id: "eldenring", title: "Elden Ring", dev: "FromSoftware", platform: "PS5", genre: "Action RPG", year: 2022, status: "Completed", hours: 130, finished: "2023-09-30", scores: [10, 7, 9, 9, 10, 9] },
  { id: "hifi", title: "Hi-Fi Rush", dev: "Tango Gameworks", platform: "Xbox", genre: "Action", year: 2023, status: "Completed", hours: 12, finished: "2023-05-14", scores: [9, 7, 9, 10, 6, 9] },
  { id: "celeste", title: "Celeste", dev: "Maddy Makes Games", platform: "Switch", genre: "Platformer", year: 2018, status: "Dropped", hours: 8, finished: "2023-02-02", scores: [9, 8, 7, 9, 6, 7] },
];

const average = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

/** Overall score: plain average of the six axes. */
export const overallScore = (game: Game) => average(game.scores);

/** Dropped games stay in the log but don't count towards scores. */
export const ratedGames = (games: Game[] = GAMES) => games.filter((g) => g.status !== "Dropped");

export function libraryStats(games: Game[] = GAMES) {
  return {
    count: games.length,
    hours: games.reduce((sum, g) => sum + g.hours, 0),
    avgScore: average(ratedGames(games).map(overallScore)),
  };
}
