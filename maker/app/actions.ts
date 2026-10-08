"use server";

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { toFields, type Draft } from "../lib/draft";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

/** Creates the game (`id` null) or updates it. Fields not edited by the maker are left as they are. */
export async function saveGame(id: string | null, draft: Draft): Promise<SaveResult> {
  const { id: slug, ...fields } = toFields(draft);
  if (!fields.title) return { ok: false, error: "The title is required." };
  if (id && !ObjectId.isValid(id)) return { ok: false, error: "Unknown game." };

  const db = await getDatabase();
  const collection = db.collection("games");
  const _id = id ? new ObjectId(id) : null;

  // The slug is the game's URL: it must not be another game's.
  if (slug) {
    if (!/^[a-z0-9-]+$/.test(slug)) return { ok: false, error: "The URL id may only use lowercase letters, digits and dashes." };
    const taken = await collection.findOne({ id: slug, ...(_id ? { _id: { $ne: _id } } : {}) }, { projection: { _id: 1 } });
    if (taken) return { ok: false, error: `Another game already uses the URL id "${slug}".` };
  }

  if (!_id) {
    const { insertedId } = await collection.insertOne(slug ? { ...fields, id: slug } : fields);
    return { ok: true, id: insertedId.toHexString() };
  }
  const result = await collection.updateOne({ _id }, slug ? { $set: { ...fields, id: slug } } : { $set: fields, $unset: { id: "" } });
  if (!result.matchedCount) return { ok: false, error: "This game no longer exists." };
  return { ok: true, id: _id.toHexString() };
}
