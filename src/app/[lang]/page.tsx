import type { Metadata } from "next";
import { GAMETAGS } from "@/components/find-peppobot";
import { HallOfFame } from "@/components/hall-of-fame";
import { HomeHero } from "@/components/home-hero";
import { LatestReports } from "@/components/latest-reports";
import { NowPlaying } from "@/components/now-playing";
import { SITE_NAME, SITE_URL } from "@/content/site";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/");
}

export default async function Home() {
  const [lang, { meta }] = await Promise.all([getLocale(), getDictionary()]);

  // Tells search engines the site's name and logo, so results show "Peppobot" and not a game's title or cover.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        alternateName: "peppobot.com",
        url: `${SITE_URL}/`,
        description: meta.description,
        inLanguage: lang,
        publisher: { "@id": `${SITE_URL}/#peppobot` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#peppobot`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/icon.png`,
        image: `${SITE_URL}/og.png`,
        sameAs: GAMETAGS.flatMap((tag) => tag.url ?? []),
      },
    ],
  };

  return (
    <main className="flex-1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <HomeHero />
      <NowPlaying />
      <LatestReports />
      <HallOfFame />
    </main>
  );
}
