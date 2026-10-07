import type { Locale } from "@/i18n/config";
import { pickTranslation, type Translated } from "@/i18n/translations";

/**
 * A stored text in the page's language, or its best fallback. A fallback in another
 * language carries its own `lang`, so browsers and screen readers read it correctly.
 */
export function TranslatedText({ text, lang, as: Tag = "p", quoted = false, className }: { text: Translated | null | undefined; lang: Locale; as?: "p" | "span"; quoted?: boolean; className?: string }) {
  const picked = pickTranslation(text, lang);
  if (!picked) return null;
  return (
    <Tag lang={picked.key === lang ? undefined : picked.key} className={className}>
      {quoted ? `“${picked.value}”` : picked.value}
    </Tag>
  );
}
