// Creates the indexes of the crew collections (users, sessions, reviews), for a database user
// allowed `createIndex`. Mirrors `ensureCrewIndexes` in src/lib/auth.ts. Safe to run again.
//   node --env-file=.env scripts/crew-indexes.mjs
import { MongoClient } from "mongodb";

const { MONGODB_URI: uri, MONGODB_DB: name } = process.env;
if (!uri || !name) {
  console.error("Set MONGODB_URI and MONGODB_DB (e.g. node --env-file=.env scripts/crew-indexes.mjs).");
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
try {
  const db = client.db(name);
  const created = await Promise.all([
    db.collection("users").createIndex({ googleSub: 1 }, { unique: true }),
    db.collection("users").createIndex({ tagKey: 1 }, { unique: true, partialFilterExpression: { tagKey: { $type: "string" } } }),
    db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("reviews").createIndex({ game: 1, user: 1 }, { unique: true }),
    db.collection("reviews").createIndex({ game: 1, updatedAt: -1, _id: -1 }),
  ]);
  console.log(`Indexes ready: ${created.join(", ")}`);
} finally {
  await client.close();
}
