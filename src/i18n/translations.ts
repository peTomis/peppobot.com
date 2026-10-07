import { defaultLocale, type Locale } from "./config";

/** One language version of a text stored with the content (e.g. a game description). */
export type TextWithTranslation = { key: Locale; value: string };

/** A text in all the languages it was written in. */
export type Translated = TextWithTranslation[];

/**
 * The version of `texts` to show in `lang`: that language first, then the default
 * locale, then whatever exists. `key` is the language actually returned, so callers
 * can set `lang` on the element when it differs from the page.
 */
export function pickTranslation(texts: Translated | null | undefined, lang: Locale): TextWithTranslation | null {
  const usable = texts?.filter((text) => text.value?.trim()) ?? [];
  return usable.find((text) => text.key === lang) ?? usable.find((text) => text.key === defaultLocale) ?? usable[0] ?? null;
}
