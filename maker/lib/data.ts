import "server-only";
import { AXES, TIERS, tierOf, type Genre, type Platform } from "@/content/games";
import type { Data } from "@/content/data";
import { getDatabase } from "@/lib/mongodb";
import type { StoredGame } from "./draft";

const round = (value: number) => Math.round(value * 10) / 10;

const mean = (values: number[]) => (values.length ? round(values.reduce((total, value) => total + value, 0) / values.length) : null);

/** The site-wide figures, as described on `Data`: score figures from completed games with all six axes scored. */
export function computeData(games: StoredGame[]): Data {
  const scored = games.filter((game) => game.status === "Completed" && game.average != null) as (StoredGame & { average: number })[];

  const platformHours = new Map<Platform, number>();
  for (const game of games) {
    if (game.platform == null || !game.hours) continue;
    platformHours.set(game.platform, (platformHours.get(game.platform) ?? 0) + game.hours);
  }

  const genres = new Map<Genre, number[]>();
  for (const game of scored) {
    if (game.genre == null) continue;
    genres.set(game.genre, [...(genres.get(game.genre) ?? []), game.average]);
  }

  return {
    count: games.length,
    hours: games.reduce((total, game) => total + (game.hours ?? 0), 0),
    avgScore: mean(scored.map((game) => game.average)),
    completed: games.filter((game) => game.status === "Completed").length,
    // Per axis, so an axis left empty on one game does not drop the others.
    axes: AXES.map((_, axis) => mean(scored.flatMap((game) => game.scores?.[axis] ?? []))),
    tiers: TIERS.map((tier) => scored.filter((game) => tierOf(game.average).label === tier.label).length),
    platformHours: [...platformHours].map(([platform, hours]) => ({ platform, hours })).sort((a, b) => b.hours - a.hours),
    genres: [...genres]
      .map(([genre, averages]) => ({ genre, count: averages.length, avgScore: mean(averages)! }))
      .sort((a, b) => b.avgScore - a.avgScore),
  };
}

/** Recomputes the single `data` document from every game. */
export async function refreshData(): Promise<void> {
  const db = await getDatabase();
  const games = await db
    .collection<StoredGame>("games")
    .find({}, { projection: { _id: 0, status: 1, hours: 1, platform: 1, genre: 1, scores: 1, average: 1 } })
    .toArray();
  await db.collection<Data>("data").replaceOne({}, computeData(games), { upsert: true });
}
