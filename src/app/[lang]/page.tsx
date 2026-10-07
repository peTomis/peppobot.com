import type { Metadata } from "next";
import { HomeHero } from "@/components/home-hero";
import { localizedAlternates } from "@/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: await localizedAlternates("/") };
}

export default function Home() {
  return (
    <main className="flex-1">
      <HomeHero />
    </main>
  );
}
