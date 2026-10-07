import "server-only";
import { MongoClient } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

/** One connection pool per server process, including during development reloads. */
export async function getDatabase() {
  const uri = process.env.MONGODB_URI;
  const name = process.env.MONGODB_DB;
  if (!uri || !name) {
    throw new Error("Set MONGODB_URI and MONGODB_DB in the server environment.");
  }

  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    globalForMongo.mongoClientPromise = client.connect().catch(async (error) => {
      globalForMongo.mongoClientPromise = undefined;
      await client.close();
      throw error;
    });
  }

  const client = await globalForMongo.mongoClientPromise;
  return client.db(name);
}
