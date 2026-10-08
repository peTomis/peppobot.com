import "server-only";
import { ObjectId } from "mongodb";
import type { GameStatus } from "@/content/games";
import { getDatabase } from "@/lib/mongodb";
import type { StoredGame } from "./draft";

export type GameEntry = { _id: string; title: string; status: GameStatus; dlc: boolean };

async function games() {
  const db = await getDatabase();
  return db.collection<StoredGame>("games");
}

/** Every game, for the picker, A–Z. */
export async function listGames(): Promise<GameEntry[]> {
  const collection = await games();
  const entries = await collection.find({}, { projection: { _id: 1, title: 1, status: 1, dlc: 1 } }).sort({ title: 1 }).toArray();
  return entries.map((entry) => ({ _id: entry._id.toHexString(), title: entry.title ?? "", status: entry.status ?? "Not Started", dlc: entry.dlc ?? false }));
}

/** One game's document and report number (order of logging, as on the site), or null. */
export async function loadGame(id: string): Promise<{ game: StoredGame; number: number } | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await games();
  const _id = new ObjectId(id);
  const game = await collection.findOne({ _id }, { projection: { _id: 0 } });
  if (!game) return null;
  const number = await collection.countDocuments({ _id: { $lte: _id } });
  // Plain values only: the document goes to a client component.
  return { game: JSON.parse(JSON.stringify(game)), number };
}

/** Report number a new game would get. */
export async function nextNumber(): Promise<number> {
  const collection = await games();
  return (await collection.countDocuments()) + 1;
}
