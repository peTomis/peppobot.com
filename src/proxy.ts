import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, defaultLocale, hasLocale, localizePath, type Locale } from "@/i18n/config";

/** Saved choice first, then the browser's Accept-Language, then the default. */
function pickLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (saved && hasLocale(saved)) return saved;

  const preferred = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.split("-")[0].toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .find(({ lang }) => hasLocale(lang));

  return (preferred?.lang as Locale | undefined) ?? defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];
  if (hasLocale(first)) return;

  const url = request.nextUrl.clone();
  url.pathname = localizePath(pathname, pickLocale(request));
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API routes and files with an extension (e.g. /peppobot.png).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
