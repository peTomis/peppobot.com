import type { Metadata } from "next";
import { localizePath, locales } from "./config";
import { getLocale } from "./dictionaries";

/** Canonical + hreflang links for a path without the locale prefix. */
export async function localizedAlternates(path: string): Promise<Metadata["alternates"]> {
  const lang = await getLocale();
  return {
    canonical: localizePath(path, lang),
    languages: Object.fromEntries(locales.map((l) => [l, localizePath(path, l)])),
  };
}
