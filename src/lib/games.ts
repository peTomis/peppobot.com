import "server-only";
import { cacheLife } from "next/cache";
import type { Game, LibraryStats } from "@/content/games";
import { getDatabase } from "@/lib/mongodb";

// Explicit public fields: additional database fields never leak into API responses.
const projection = {
  _id: 0,
  id: 1,
  title: 1,
  dev: 1,
  platform: 1,
  genre: 1,
  year: 1,
  status: 1,
  hours: 1,
  finished: 1,
  progress: 1,
  scores: 1,
  average: 1,
};

export async function getGames(limit = 50, offset = 0): Promise<Game[]> {
  const db = await getDatabase();
  return db.collection<Game>("games").find({}, { projection }).sort({ finished: -1, id: 1 }).skip(offset).limit(limit).maxTimeMS(5000).toArray();
}

export async function getGame(id: string): Promise<Game | null> {
  const db = await getDatabase();
  return db.collection<Game>("games").findOne({ id }, { projection, maxTimeMS: 5000 });
}

/** Aggregate the entire collection, independently of list pagination or status. */
export async function libraryStats(): Promise<LibraryStats> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 120 });
  const db = await getDatabase();
  const metrics = await db
    .collection<Game>("games")
    .aggregate<LibraryStats>(
      [
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            hours: { $sum: "$hours" },
            avgScore: { $avg: { $cond: [{ $eq: ["$status", "Completed"] }, "$average", null] } },
          },
        },
        { $project: { _id: 0, count: 1, hours: 1, avgScore: 1 } },
      ],
      { maxTimeMS: 5000 },
    )
    .next();
  return metrics ?? { count: 0, hours: 0, avgScore: null };
}
