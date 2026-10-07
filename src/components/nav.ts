import type { Dictionary } from "@/i18n/dictionaries";
import { localizePath, unlocalizePath, type Locale } from "@/i18n/config";

export type NavItem = {
  /** Path without the locale prefix. */
  href: string;
  key: keyof Dictionary["nav"];
  /** Extra path prefixes that also mark this item active. */
  match?: string[];
};

export const NAV: NavItem[] = [
  { href: "/", key: "home" },
  { href: "/library", key: "library", match: ["/games"] },
  { href: "/telemetry", key: "telemetry" },
  { href: "/queue", key: "queue" },
  { href: "/protocol", key: "protocol" },
];

/** Accents cycle green → purple → pink, as in the design. */
export const ACCENTS = ["var(--acc)", "var(--acc2)"];

export function isActive(item: NavItem, pathname: string | null) {
  if (!pathname) return false;
  const path = unlocalizePath(pathname);
  if (item.href === "/") return path === "/";
  return [item.href, ...(item.match ?? [])].some((p) => path === p || path.startsWith(`${p}/`));
}

/** Report page of one game. */
export const gameHref = (lang: Locale, id: string) => localizePath(`/library/${encodeURIComponent(id)}`, lang);
