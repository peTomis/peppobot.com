import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { localizePath, locales } from "@/i18n/config";
import { SITE_URL } from "@/content/site";
import { getGameSlugs } from "@/lib/games";

const PAGES = ["/", "/library", "/telemetry", "/protocol"];

/** One entry per page and language, each listing its other languages. */
function entries(path: string): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map((l) => [l, `${SITE_URL}${localizePath(path, l)}`]));
  return locales.map((l) => ({ url: languages[l], alternates: { languages } }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Read the games on request: building the site does not need a database.
  await connection();
  const slugs = await getGameSlugs();
  return [...PAGES, ...slugs.map((slug) => `/library/${encodeURIComponent(slug)}`)].flatMap(entries);
}
