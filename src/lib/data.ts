import "server-only";
import { cacheLife } from "next/cache";
import type { Data } from "@/content/data";
import { getDatabase } from "@/lib/mongodb";

// Explicit public fields: additional database fields never leak into API responses.
const projection = { _id: 0, count: 1, hours: 1, avgScore: 1, completed: 1, axes: 1, tiers: 1, platformHours: 1, genres: 1 };

const EMPTY: Data = { count: 0, hours: 0, avgScore: null, completed: 0, axes: [], tiers: [], platformHours: [], genres: [] };

/** The single `data` document: read as is, no query on the games. Missing fields fall back to empty values. */
export async function getData(): Promise<Data> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 120 });
  const db = await getDatabase();
  const data = await db.collection<Data>("data").findOne({}, { projection, maxTimeMS: 5000 });
  return { ...EMPTY, ...data };
}
