export const locales = ["en", "it"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Cookie remembering the visitor's explicit language choice. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** Swaps (or adds) the locale prefix of a pathname. */
export function localizePath(pathname: string | null, locale: Locale) {
  if (!pathname) return `/${locale}`;
  const [, first, ...rest] = pathname.split("/");
  const tail = hasLocale(first) ? rest : [first, ...rest];
  return `/${[locale, ...tail].filter(Boolean).join("/")}`;
}

/** Strips the locale prefix: `/it/library` → `/library`, `/it` → `/`. */
export function unlocalizePath(pathname: string) {
  const [, first, ...rest] = pathname.split("/");
  return hasLocale(first) ? `/${rest.join("/")}` : pathname;
}
