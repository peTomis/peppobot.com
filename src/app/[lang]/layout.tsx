import type { Metadata } from "next";
import { Suspense } from "react";
import { BottomBar } from "@/components/bottom-bar";
import { FindPeppobot } from "@/components/find-peppobot";
import { ActiveTopBar, TopBar } from "@/components/top-bar";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { fontVariables } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    // Pages set a short title (e.g. "Library"), shown as "Library — Peppobot".
    title: { default: dict.meta.title, template: "%s — Peppobot" },
    description: dict.meta.description,
    metadataBase: new URL("https://www.peppobot.com"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const topBar = { lang, nav: dict.nav, strings: dict.topBar };

  return (
    <html
      lang={lang}
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<TopBar pathname={null} {...topBar} />}>
          <ActiveTopBar {...topBar} />
        </Suspense>
        {children}
        <FindPeppobot />
        <BottomBar />
      </body>
    </html>
  );
}
