import "server-only";
import { ObjectId, type Document } from "mongodb";
import { connection } from "next/server";
import type { Genre, Scores } from "@/content/games";
import type { CrewBlock, CrewReview, CrewStats } from "@/content/reviews";
import type { Translated } from "@/i18n/translations";
import { getAccountCollections } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

/** Stored crew review: one per user and game. */
type ReviewDocument = {
  _id: ObjectId;
  game: ObjectId;
  user: ObjectId;
  scores: Scores;
  average: number;
  blocks: CrewBlock[];
  lang: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Crew averages of one game, kept up to date on every review write, so pages never aggregate the reviews. `_id` is the game's. */
type StatsDocument = { _id: ObjectId; count: number; scores: Scores | null; average: number | null; updatedAt: Date };

/** What the review form needs about a game. */
export type ReviewTarget = { key: string; id: string; title: string; genre: Genre; signature: Translated | null; released: boolean };

async function collections() {
  await getAccountCollections();
  const db = await getDatabase();
  return { reviews: db.collection<ReviewDocument>("reviews"), stats: db.collection<StatsDocument>("reviewStats"), games: db.collection("games") };
}

/** A game by slug or ObjectId, with what reviews need. */
export async function getReviewTarget(id: string): Promise<ReviewTarget | null> {
  // `released` reads the clock: render at request time.
  await connection();
  const { games } = await collections();
  const filter = /^[a-f0-9]{24}$/i.test(id) ? { $or: [{ id }, { _id: new ObjectId(id) }] } : { id };
  const game = await games.findOne(filter, { projection: { _id: 1, id: 1, title: 1, genre: 1, signature: 1, releasedOn: 1 }, maxTimeMS: 5000 });
  if (!game) return null;
  return {
    key: game._id.toHexString(),
    id: game.id || game._id.toHexString(),
    title: game.title,
    genre: game.genre,
    signature: game.signature ?? null,
    // Only games already out can be reviewed.
    released: typeof game.releasedOn === "number" && game.releasedOn <= Date.now(),
  };
}

// Reviews show the author's current tag, never their Google name or email.
const withTag: Document[] = [
  { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "author", pipeline: [{ $project: { _id: 0, tag: 1 } }] } },
  { $project: { scores: 1, average: 1, blocks: 1, lang: 1, createdAt: 1, updatedAt: 1, tag: { $first: "$author.tag" } } },
];

type ReviewRow = Pick<ReviewDocument, "_id" | "scores" | "average" | "blocks" | "lang" | "createdAt" | "updatedAt"> & { tag?: string };

const toReview = (row: ReviewRow): CrewReview => ({
  id: row._id.toHexString(),
  tag: row.tag ?? "—",
  scores: row.scores,
  average: row.average,
  blocks: row.blocks ?? [],
  lang: row.lang,
  createdAt: row.createdAt.getTime(),
  updatedAt: row.updatedAt.getTime(),
});

/** Crew averages of a game; a game nobody has reviewed has count 0. */
export async function getCrewStats(gameKey: string): Promise<CrewStats> {
  const { stats } = await collections();
  const document = await stats.findOne({ _id: new ObjectId(gameKey) }, { maxTimeMS: 5000 });
  return { count: document?.count ?? 0, scores: document?.scores ?? null, average: document?.average ?? null };
}

/** One page of a game's reviews, most recently updated first. */
export async function getCrewReviews(gameKey: string, { limit, offset = 0 }: { limit: number; offset?: number }): Promise<CrewReview[]> {
  const { reviews } = await collections();
  const rows = await reviews
    .aggregate<ReviewRow>([{ $match: { game: new ObjectId(gameKey) } }, { $sort: { updatedAt: -1, _id: -1 } }, { $skip: offset }, { $limit: limit }, ...withTag], { maxTimeMS: 5000 })
    .toArray();
  return rows.map(toReview);
}

/** The user's own review of a game, if any. */
export async function getOwnReview(gameKey: string, userId: string): Promise<CrewReview | null> {
  const { reviews } = await collections();
  const [row] = await reviews.aggregate<ReviewRow>([{ $match: { game: new ObjectId(gameKey), user: new ObjectId(userId) } }, { $limit: 1 }, ...withTag], { maxTimeMS: 5000 }).toArray();
  return row ? toReview(row) : null;
}

/** Creates or replaces the user's review of a game, then refreshes the game's crew averages. */
export async function saveReview(gameKey: string, userId: string, review: { scores: Scores; average: number; blocks: CrewBlock[]; lang: string }) {
  const { reviews } = await collections();
  const game = new ObjectId(gameKey);
  const now = new Date();
  await reviews.updateOne(
    { game, user: new ObjectId(userId) },
    { $set: { ...review, updatedAt: now }, $setOnInsert: { _id: new ObjectId(), game, user: new ObjectId(userId), createdAt: now } },
    { upsert: true },
  );
  await refreshStats(game);
}

/** Deletes the user's review of a game, then refreshes the game's crew averages. */
export async function deleteReview(gameKey: string, userId: string) {
  const { reviews } = await collections();
  const game = new ObjectId(gameKey);
  await reviews.deleteOne({ game, user: new ObjectId(userId) });
  await refreshStats(game);
}

/** Recomputes one game's crew averages from its reviews. */
async function refreshStats(game: ObjectId) {
  const { reviews, stats } = await collections();
  const [row] = await reviews
    .aggregate<{ count: number; axes: number[]; average: number }>([
      { $match: { game } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          average: { $avg: "$average" },
          ...Object.fromEntries([0, 1, 2, 3, 4, 5].map((axis) => [`a${axis}`, { $avg: { $arrayElemAt: ["$scores", axis] } }])),
        },
      },
      { $project: { _id: 0, count: 1, average: 1, axes: [0, 1, 2, 3, 4, 5].map((axis) => `$a${axis}`) } },
    ])
    .toArray();
  const round = (value: number) => Math.round(value * 10) / 10;
  await stats.replaceOne(
    { _id: game },
    { count: row?.count ?? 0, scores: row ? (row.axes.map(round) as Scores) : null, average: row ? round(row.average) : null, updatedAt: new Date() },
    { upsert: true },
  );
}

/** A crew review with the game it is about. */
export type AuthoredReview = CrewReview & { game: { id: string; title: string; genre: Genre; signature: Translated | null } };

type AuthoredRow = ReviewRow & { gameDoc: { _id: ObjectId; id?: string; title: string; genre: Genre; signature?: Translated | null } };

// The review's game, then its author's current tag; reviews of deleted games drop out.
const withGameAndTag: Document[] = [
  { $lookup: { from: "games", localField: "game", foreignField: "_id", as: "gameDoc", pipeline: [{ $project: { _id: 1, id: 1, title: 1, genre: 1, signature: 1 } }] } },
  { $unwind: "$gameDoc" },
  { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "author", pipeline: [{ $project: { _id: 0, tag: 1 } }] } },
  { $project: { scores: 1, average: 1, blocks: 1, lang: 1, createdAt: 1, updatedAt: 1, gameDoc: 1, tag: { $first: "$author.tag" } } },
];

const toAuthored = (row: AuthoredRow): AuthoredReview => ({
  ...toReview(row),
  game: { id: row.gameDoc.id || row.gameDoc._id.toHexString(), title: row.gameDoc.title, genre: row.gameDoc.genre, signature: row.gameDoc.signature ?? null },
});

/** One review and the other reviews by the same author (most recent first, up to `limit`), or null when it does not exist. The author's id never leaves the server. */
export async function getReviewThread(reviewId: string, limit = 50): Promise<{ review: AuthoredReview; others: AuthoredReview[] } | null> {
  if (!/^[a-f0-9]{24}$/i.test(reviewId)) return null;
  const { reviews } = await collections();
  const _id = new ObjectId(reviewId);
  const author = await reviews.findOne({ _id }, { projection: { user: 1 }, maxTimeMS: 5000 });
  if (!author) return null;
  const [[row], others] = await Promise.all([
    reviews.aggregate<AuthoredRow>([{ $match: { _id } }, ...withGameAndTag], { maxTimeMS: 5000 }).toArray(),
    reviews.aggregate<AuthoredRow>([{ $match: { user: author.user, _id: { $ne: _id } } }, { $sort: { updatedAt: -1, _id: -1 } }, { $limit: limit }, ...withGameAndTag], { maxTimeMS: 5000 }).toArray(),
  ]);
  if (!row) return null;
  return { review: toAuthored(row), others: others.map(toAuthored) };
}
