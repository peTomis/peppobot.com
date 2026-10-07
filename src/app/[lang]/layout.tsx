import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { BottomBar } from "@/components/bottom-bar";
import { FindPeppobot } from "@/components/find-peppobot";
import { ActiveTopBar, TopBar } from "@/components/top-bar";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import "../globals.css";

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

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
      className={`${chakraPetch.variable} ${plexSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
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
