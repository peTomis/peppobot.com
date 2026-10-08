import { normalizeGame, type Game, type GameFields, type GameStatus, type Genre, type Platform, type ReportBlock, type Scores } from "@/content/games";
import type { Translated } from "@/i18n/translations";

/** A report block with a key that stays the same while blocks are dragged around. */
export type KeyedBlock = { key: string; block: ReportBlock };

/** Everything the editor changes. Empty strings and empty lists are cleaned up on save. */
export type Draft = {
  id: string;
  title: string;
  dev: string;
  platform: Platform;
  alsoPlayedOn: Platform[];
  genre: Genre;
  dlc: boolean;
  /** Hex id of the main game; "" when none is picked. */
  mainGame: string;
  status: GameStatus;
  hours: number;
  progress: number | null;
  releasedOn: number | null;
  finishedOn: number | null;
  cover: string;
  description: Translated;
  signature: Translated;
  scores: (number | null)[];
  pros: Translated[];
  cons: Translated[];
  blocks: KeyedBlock[];
};

/** A game document as read from MongoDB, without `_id`; old documents may miss any field. */
export type StoredGame = Partial<Omit<GameFields, "scores">> & { scores?: (number | null)[] | null };

export const EMPTY_SCORES = [null, null, null, null, null, null];

export function emptyDraft(): Draft {
  return {
    id: "",
    title: "",
    dev: "",
    platform: 1,
    alsoPlayedOn: [],
    genre: 1,
    dlc: false,
    mainGame: "",
    status: "Not Started",
    hours: 0,
    progress: null,
    releasedOn: null,
    finishedOn: null,
    cover: "",
    description: [],
    signature: [],
    scores: EMPTY_SCORES,
    pros: [],
    cons: [],
    blocks: [],
  };
}

export function toDraft(game: StoredGame): Draft {
  const empty = emptyDraft();
  return {
    id: game.id ?? "",
    title: game.title ?? "",
    dev: game.dev ?? "",
    platform: game.platform ?? empty.platform,
    alsoPlayedOn: game.alsoPlayedOn ?? [],
    genre: game.genre ?? empty.genre,
    dlc: game.dlc ?? false,
    // Read through JSON, so a stored ObjectId arrives as its hex string.
    mainGame: game.mainGame ? String(game.mainGame) : "",
    status: game.status ?? empty.status,
    hours: game.hours ?? 0,
    progress: game.progress ?? null,
    releasedOn: game.releasedOn ?? null,
    finishedOn: game.finishedOn ?? null,
    cover: game.cover ?? "",
    description: game.description ?? [],
    signature: game.signature ?? [],
    scores: game.scores?.length === 6 ? game.scores : EMPTY_SCORES,
    pros: game.pros ?? [],
    cons: game.cons ?? [],
    // Keys are positional on load, so server and client render the same ones.
    blocks: (game.blocks ?? []).map((block, index) => ({ key: `b${index}`, block })),
  };
}

/** The protocol's "one simple average" of the six axes, to one decimal; null until all six are scored. */
export function averageOf(scores: (number | null)[]): number | null {
  if (scores.length !== 6 || scores.some((score) => score == null)) return null;
  const sum = (scores as number[]).reduce((total, score) => total + score, 0);
  return Math.round((sum / 6) * 10) / 10;
}

/** Drops empty translations, so a blank Italian field never hides the English text. */
const clean = (text: Translated) => text.filter((entry) => entry.value.trim());

/** The document fields to store. `id` is undefined when the game uses its MongoDB id in URLs; `mainGame` is a hex id, turned into an ObjectId on save. */
export function toFields(draft: Draft): Omit<GameFields, "id" | "mainGame"> & { id: string | undefined; mainGame: string | null } {
  const pros = draft.pros.map(clean).filter((text) => text.length);
  const cons = draft.cons.map(clean).filter((text) => text.length);
  const signature = clean(draft.signature);
  const alsoPlayedOn = draft.alsoPlayedOn.filter((platform) => platform !== draft.platform);
  const scored = draft.scores.some((score) => score != null);
  return {
    id: draft.id.trim() || undefined,
    title: draft.title.trim(),
    dev: draft.dev.trim(),
    platform: draft.platform,
    alsoPlayedOn: alsoPlayedOn.length ? alsoPlayedOn : null,
    genre: draft.genre,
    dlc: draft.dlc,
    mainGame: draft.dlc ? draft.mainGame || null : null,
    status: draft.status,
    hours: draft.hours,
    progress: draft.progress,
    releasedOn: draft.releasedOn,
    finishedOn: draft.finishedOn,
    cover: draft.cover.trim() || null,
    description: clean(draft.description),
    signature: signature.length ? signature : null,
    // The radar and bars show a dash for an axis not scored yet.
    scores: scored ? (draft.scores as Scores) : null,
    average: averageOf(draft.scores),
    pros: pros.length ? pros : null,
    cons: cons.length ? cons : null,
    // The JSON round trip drops cleared optional fields (accent, src), which MongoDB would store as null.
    blocks: draft.blocks.length ? JSON.parse(JSON.stringify(draft.blocks.map(({ block }) => block))) : null,
  };
}

/** The game as the site's report page would show it. */
export function previewGame(draft: Draft, fallbackId: string): Game {
  const { id, ...fields } = toFields(draft);
  return normalizeGame({ ...fields, id }, fallbackId);
}

/** `YYYY-MM-DD` in UTC, as the site reads dates, for date inputs. */
export const toDateInput = (time: number | null) => (time == null ? "" : new Date(time).toISOString().slice(0, 10));

export const fromDateInput = (value: string) => (value ? Date.parse(`${value}T00:00:00Z`) : null);
