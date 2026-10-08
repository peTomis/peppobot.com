import "server-only";
import { ObjectId, type WithId } from "mongodb";
import { GENRES, normalizeGame, PLATFORMS, type Game, type GameFields, type GameReport, type LibraryPage, type LibraryQuery, type LibrarySort } from "@/content/games";
import { getDatabase } from "@/lib/mongodb";

// Explicit public fields: additional database fields never leak into API responses.
const projection = {
  _id: 1,
  id: 1,
  title: 1,
  dev: 1,
  platform: 1,
  genre: 1,
  releasedOn: 1,
  status: 1,
  hours: 1,
  finishedOn: 1,
  progress: 1,
  description: 1,
  cover: 1,
  scores: 1,
  average: 1,
};

// The report body is heavy: only the game page asks for it.
const reportProjection = { ...projection, pros: 1, cons: 1, signature: 1, blocks: 1 };

type GameDocument = GameFields;

function toGame({ _id, ...game }: WithId<GameDocument>): Game {
  return normalizeGame(game, _id.toHexString());
}

export async function getGames(limit = 50, offset = 0): Promise<Game[]> {
  const db = await getDatabase();
  const games = await db.collection<GameDocument>("games").find({}, { projection }).sort({ finishedOn: -1, _id: 1 }).skip(offset).limit(limit).maxTimeMS(5000).toArray();
  return games.map(toGame);
}

/** Games still in progress, most recent session first. */
export async function getPlayingGames(): Promise<Game[]> {
  const db = await getDatabase();
  const games = await db.collection<GameDocument>("games").find({ status: "Playing" }, { projection }).sort({ finishedOn: -1, _id: 1 }).maxTimeMS(5000).toArray();
  return games.map(toGame);
}

/** Most recently completed games, i.e. the latest filed reports. */
export async function getLatestReports(limit = 3): Promise<Game[]> {
  const db = await getDatabase();
  const games = await db.collection<GameDocument>("games").find({ status: "Completed" }, { projection }).sort({ finishedOn: -1, _id: 1 }).limit(limit).maxTimeMS(5000).toArray();
  return games.map(toGame);
}

/** Best-scored completed games. */
export async function getTopRated(limit = 5): Promise<Game[]> {
  const db = await getDatabase();
  const games = await db.collection<GameDocument>("games").find({ status: "Completed", average: { $ne: null } }, { projection }).sort({ average: -1, _id: 1 }).limit(limit).maxTimeMS(5000).toArray();
  return games.map(toGame);
}

/** The next game to play: the oldest one not started yet. */
export async function getNextInQueue(): Promise<Game | null> {
  const db = await getDatabase();
  const [game] = await db.collection<GameDocument>("games").find({ status: "Not Started" }, { projection }).sort({ _id: 1 }).limit(1).maxTimeMS(5000).toArray();
  return game ? toGame(game) : null;
}

const LIBRARY_PAGE_SIZE = 12;

// Ties fall back to `_id` so paging is stable.
const LIBRARY_ORDER: Record<LibrarySort, Record<string, 1 | -1>> = {
  recent: { finishedOn: -1, _id: -1 },
  score: { average: -1, _id: -1 },
  hours: { hours: -1, _id: -1 },
  az: { title: 1, _id: 1 },
};

/** One page of the library, filtered by status and a free-text search. */
export async function getLibraryPage({ q, status, sort, page }: LibraryQuery): Promise<LibraryPage> {
  const db = await getDatabase();
  const collection = db.collection<GameDocument>("games");

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const search = q.trim();
  if (search) {
    const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    // Platforms and genres are stored as ids, so match their names here.
    const platforms = Object.values(PLATFORMS).filter((platform) => pattern.test(platform.name)).map((platform) => platform.id);
    const genres = Object.values(GENRES).filter((genre) => pattern.test(genre.name)).map((genre) => genre.id);
    filter.$or = [{ title: pattern }, { dev: pattern }, { genre: { $in: genres } }, { platform: { $in: platforms } }];
  }

  const [matches, total] = await Promise.all([collection.countDocuments(filter, { maxTimeMS: 5000 }), collection.countDocuments({}, { maxTimeMS: 5000 })]);
  const pages = Math.max(1, Math.ceil(matches / LIBRARY_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  const offset = (current - 1) * LIBRARY_PAGE_SIZE;
  const games = await collection
    .find(filter, { projection })
    .sort(LIBRARY_ORDER[sort])
    .collation({ locale: "en", strength: 2 })
    .skip(offset)
    .limit(LIBRARY_PAGE_SIZE)
    .maxTimeMS(5000)
    .toArray();

  return { games: games.map(toGame), matches, total, page: current, pages, offset };
}

/** A game by slug or ObjectId, with everything its report page shows. */
export async function getGameReport(id: string): Promise<GameReport | null> {
  const db = await getDatabase();
  const collection = db.collection<GameDocument>("games");
  const filter = /^[a-f0-9]{24}$/i.test(id) ? { $or: [{ id }, { _id: new ObjectId(id) }] } : { id };
  const document = await collection.findOne(filter, { projection: reportProjection, maxTimeMS: 5000 });
  if (!document) return null;

  // Neighbours follow the library's default "recent" order: previous is older, next is newer.
  const [order, number] = await Promise.all([
    collection.find({}, { projection: { _id: 1, id: 1, title: 1 } }).sort(LIBRARY_ORDER.recent).maxTimeMS(5000).toArray(),
    collection.countDocuments({ _id: { $lte: document._id } }, { maxTimeMS: 5000 }),
  ]);
  const index = order.findIndex((entry) => entry._id.equals(document._id));
  const link = (entry: (typeof order)[number] | undefined) => (entry ? { id: entry.id || entry._id.toHexString(), title: entry.title } : null);

  return { game: toGame(document), number, prev: link(order[index + 1]), next: index > 0 ? link(order[index - 1]) : null };
}

export async function getGame(id: string): Promise<Game | null> {
  const db = await getDatabase();
  const collection = db.collection<GameDocument>("games");
  const game = await collection.findOne({ id }, { projection, maxTimeMS: 5000 });
  if (game) return toGame(game);
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  const byObjectId = await collection.findOne({ _id: new ObjectId(id) }, { projection, maxTimeMS: 5000 });
  return byObjectId ? toGame(byObjectId) : null;
}
