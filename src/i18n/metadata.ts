import type { Metadata } from "next";
import { SITE_NAME } from "@/content/site";
import { localizePath, locales, type Locale } from "./config";
import { getDictionary, getLocale } from "./dictionaries";

/** Social preview for every page without its own picture: the home hero's badge and wordmark (1200×630). */
const SITE_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: SITE_NAME };

const OG_LOCALES: Record<Locale, string> = { en: "en_US", it: "it_IT" };

type PageMetadata = {
  /** Short page title, shown as "Title — Peppobot"; the home page leaves it out. */
  title?: string;
  description?: string;
  /** Absolute URL of the page's own picture (a game's cover); defaults to the site image. */
  image?: string | null;
};

/** Title, canonical, hreflang and social preview for a path without the locale prefix. */
export async function pageMetadata(path: string, { title, description, image }: PageMetadata = {}): Promise<Metadata> {
  const [lang, { meta }] = await Promise.all([getLocale(), getDictionary()]);
  const canonical = localizePath(path, lang);
  return {
    ...(title && { title }),
    ...(description && { description }),
    // hreflang per language; `x-default` is the unprefixed path, which redirects by language.
    alternates: {
      canonical,
      languages: { ...Object.fromEntries(locales.map((l) => [l, localizePath(path, l)])), "x-default": path },
    },
    // Nested objects are not merged across segments, so each page sends the full Open Graph set.
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: title ?? SITE_NAME,
      description: description ?? meta.description,
      url: canonical,
      locale: OG_LOCALES[lang],
      alternateLocale: locales.filter((l) => l !== lang).map((l) => OG_LOCALES[l]),
      images: image ? [{ url: image, alt: title ?? SITE_NAME }] : [SITE_IMAGE],
    },
    twitter: { card: "summary_large_image" },
  };
}
