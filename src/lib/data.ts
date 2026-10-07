import "server-only";
import { cacheLife } from "next/cache";
import type { Data } from "@/content/data";
import { getDatabase } from "@/lib/mongodb";

// Explicit public fields: additional database fields never leak into API responses.
const projection = { _id: 0, count: 1, hours: 1, avgScore: 1 };

/** The single `data` document: read as is, no query on the games. */
export async function getData(): Promise<Data> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 120 });
  const db = await getDatabase();
  const data = await db.collection<Data>("data").findOne({}, { projection, maxTimeMS: 5000 });
  return data ?? { count: 0, hours: 0, avgScore: null };
}
