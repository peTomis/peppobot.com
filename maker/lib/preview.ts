import type { Game, ReportLink } from "@/content/games";
import type { Locale } from "@/i18n/config";

/** Sent by the editor to the preview frame on every change. */
export type PreviewMessage = { type: "maker:game"; game: Game; number: number; mainGame: ReportLink | null; lang: Locale };

/** Sent by the preview frame once it listens, so the editor sends the current game. */
export const READY = "maker:ready";
