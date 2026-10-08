"use server";

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { refreshData } from "../lib/data";
import { toFields, type Draft } from "../lib/draft";

/** `warning`: the game was saved, but something after it failed. */
export type SaveResult = { ok: true; id: string; warning?: string } | { ok: false; error: string };

/** Creates the game (`id` null) or updates it. Fields not edited by the maker are left as they are. */
export async function saveGame(id: string | null, draft: Draft): Promise<SaveResult> {
  const { id: slug, mainGame: mainGameId, ...rest } = toFields(draft);
  if (!rest.title) return { ok: false, error: "The title is required." };
  if (id && !ObjectId.isValid(id)) return { ok: false, error: "Unknown game." };
  if (rest.dlc && !mainGameId) return { ok: false, error: "A DLC needs its main game." };
  if (mainGameId && (!ObjectId.isValid(mainGameId) || mainGameId === id)) return { ok: false, error: "Invalid main game." };

  const db = await getDatabase();
  const collection = db.collection("games");
  const _id = id ? new ObjectId(id) : null;
  const mainGame = mainGameId ? new ObjectId(mainGameId) : null;
  if (mainGame && !(await collection.findOne({ _id: mainGame }, { projection: { _id: 1 } }))) return { ok: false, error: "The main game no longer exists." };
  const fields = { ...rest, mainGame };

  // The slug is the game's URL: it must not be another game's.
  if (slug) {
    if (!/^[a-z0-9-]+$/.test(slug)) return { ok: false, error: "The URL id may only use lowercase letters, digits and dashes." };
    const taken = await collection.findOne({ id: slug, ...(_id ? { _id: { $ne: _id } } : {}) }, { projection: { _id: 1 } });
    if (taken) return { ok: false, error: `Another game already uses the URL id "${slug}".` };
  }

  let saved: string;
  if (!_id) {
    const { insertedId } = await collection.insertOne(slug ? { ...fields, id: slug } : fields);
    saved = insertedId.toHexString();
  } else {
    const result = await collection.updateOne({ _id }, slug ? { $set: { ...fields, id: slug } } : { $set: fields, $unset: { id: "" } });
    if (!result.matchedCount) return { ok: false, error: "This game no longer exists." };
    saved = _id.toHexString();
  }

  // The site's telemetry and home KPIs read the precomputed `data` document.
  try {
    await refreshData();
  } catch {
    return { ok: true, id: saved, warning: "Saved, but the site figures (data) could not be updated. The next save will retry." };
  }
  return { ok: true, id: saved };
}
