import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import type en from "./dictionaries/en.json";
import { hasLocale, type Locale } from "./config";

export type Dictionary = typeof en;

// Typed against en.json, so a key missing from it.json fails type-checking.
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  it: () => import("./dictionaries/it.json").then((m) => m.default),
};

/** Current locale from the `[lang]` root segment; 404s on unknown values. */
export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  return locale;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()]();
}
