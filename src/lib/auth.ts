import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { ObjectId } from "mongodb";
import { SITE_URL } from "@/content/site";
import { getDatabase } from "@/lib/mongodb";

/** A visitor signed in with Google. `tag` is null until they choose one. */
export type Viewer = { id: string; tag: string | null };

/** Stored user. `email` and `name` come from Google and are never sent to pages. */
type UserDocument = {
  _id: ObjectId;
  googleSub: string;
  email: string | null;
  name: string | null;
  tag?: string;
  /** `tag` in lower case, unique. */
  tagKey?: string;
  createdAt: Date;
  lastLoginAt: Date;
};

/** Stored session: only the SHA-256 of the cookie's token, so a database leak gives no usable sessions. */
type SessionDocument = { _id: ObjectId; tokenHash: string; user: ObjectId; createdAt: Date; expiresAt: Date };

const secure = process.env.NODE_ENV === "production";
export const SESSION_COOKIE = secure ? "__Host-pb_session" : "pb_session";
export const OAUTH_COOKIE = secure ? "__Host-pb_oauth" : "pb_oauth";
const SESSION_DAYS = 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

/** Cookie options for the session and the OAuth handshake; `__Host-` needs `secure` and path `/`. */
export const cookieOptions = (maxAge: number) => ({ httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge });

let indexesRequested = false;

/** Collections for accounts and reviews. */
export async function getAccountCollections() {
  const db = await getDatabase();
  const collections = {
    users: db.collection<UserDocument>("users"),
    sessions: db.collection<SessionDocument>("sessions"),
  };
  if (!indexesRequested) {
    indexesRequested = true;
    // Best effort, once per process: the site's database user may lack `createIndex`. Then an admin
    // creates them with `scripts/crew-indexes.mjs`; pages keep working meanwhile.
    void ensureCrewIndexes(db).catch((error: unknown) => console.warn(`Crew indexes not created: ${error instanceof Error ? error.message : error}. Run scripts/crew-indexes.mjs.`));
  }
  return collections;
}

/** Indexes the crew collections rely on; the unique ones keep tags unique and one review per user and game. Mirrored in `scripts/crew-indexes.mjs`. */
function ensureCrewIndexes(db: Awaited<ReturnType<typeof getDatabase>>) {
  return Promise.all([
    db.collection("users").createIndex({ googleSub: 1 }, { unique: true }),
    db.collection("users").createIndex({ tagKey: 1 }, { unique: true, partialFilterExpression: { tagKey: { $type: "string" } } }),
    db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
    // MongoDB deletes expired sessions by itself.
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("reviews").createIndex({ game: 1, user: 1 }, { unique: true }),
    db.collection("reviews").createIndex({ game: 1, updatedAt: -1, _id: -1 }),
  ]);
}

/** Where Google sends the visitor back: the canonical site in production, the dev server's own origin locally. */
export function googleRedirectUri(origin: string) {
  return `${secure ? SITE_URL : origin}/api/auth/google/callback`;
}

/** A path on this site to return to after signing in; anything else (other hosts, `//`, `\`) falls back to `fallback`. */
export function safeNext(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001F]/.test(value) || value.length > 512) return fallback;
  return value;
}

/** Saves the user Google vouched for and opens a session; returns the token for the cookie and whether a tag is still missing. */
export async function signIn(profile: { sub: string; email: string | null; name: string | null }) {
  const { users, sessions } = await getAccountCollections();
  const now = new Date();
  const user = await users.findOneAndUpdate(
    { googleSub: profile.sub },
    { $set: { email: profile.email, name: profile.name, lastLoginAt: now }, $setOnInsert: { googleSub: profile.sub, createdAt: now } },
    { upsert: true, returnDocument: "after", projection: { _id: 1, tag: 1 } },
  );
  if (!user) throw new Error("User upsert returned nothing.");
  const token = randomToken();
  await sessions.insertOne({ _id: new ObjectId(), tokenHash: hashToken(token), user: user._id, createdAt: now, expiresAt: new Date(now.getTime() + SESSION_DAYS * 86_400_000) });
  return { token, maxAge: SESSION_DAYS * 86_400, needsTag: !user.tag };
}

/** The signed-in visitor from the session cookie, or null. Reads cookies, so callers render at request time. */
export async function getViewer(): Promise<Viewer | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  // The expiry check reads the clock: render at request time, never in a (runtime) prerender.
  await connection();
  const { users, sessions } = await getAccountCollections();
  const session = await sessions.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } }, { projection: { user: 1 }, maxTimeMS: 5000 });
  if (!session) return null;
  const user = await users.findOne({ _id: session.user }, { projection: { _id: 1, tag: 1 }, maxTimeMS: 5000 });
  return user ? { id: user._id.toHexString(), tag: user.tag ?? null } : null;
}

/** Ends the current session, in the database and in the browser. Only from a server action or route handler. */
export async function signOut() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const { sessions } = await getAccountCollections();
    await sessions.deleteOne({ tokenHash: hashToken(token) });
  }
  // `__Host-` cookies are only replaced with the same attributes.
  store.set(SESSION_COOKIE, "", cookieOptions(0));
}

/** Gives the user a tag, if nobody else has it in any case. */
export async function setTag(userId: string, tag: string): Promise<"ok" | "taken"> {
  const { users } = await getAccountCollections();
  const tagKey = tag.toLowerCase();
  const holder = await users.findOne({ tagKey }, { projection: { _id: 1 } });
  if (holder && !holder._id.equals(userId)) return "taken";
  try {
    await users.updateOne({ _id: new ObjectId(userId) }, { $set: { tag, tagKey } });
    return "ok";
  } catch (error) {
    // Two visitors racing for the same tag: the unique index lets only one through.
    if ((error as { code?: number }).code === 11000) return "taken";
    throw error;
  }
}
