import type { Metadata } from "next";
import { HallOfFame } from "@/components/hall-of-fame";
import { HomeHero } from "@/components/home-hero";
import { LatestReports } from "@/components/latest-reports";
import { NowPlaying } from "@/components/now-playing";
import { localizedAlternates } from "@/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: await localizedAlternates("/") };
}

export default function Home() {
  return (
    <main className="flex-1">
      <HomeHero />
      <NowPlaying />
      <LatestReports />
      <HallOfFame />
    </main>
  );
}
