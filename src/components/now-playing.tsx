import { connection } from "next/server";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getPlayingGames } from "@/lib/games";
import { NowPlayingCard } from "./game-cards";
import { SectionHeading } from "./section-heading";

type Strings = Awaited<ReturnType<typeof getDictionary>>["nowPlaying"];

/** Home section 01: one card per game still in progress. */
export async function NowPlaying() {
  const [lang, { nowPlaying: t }] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <Suspense>
      <NowPlayingSection lang={lang} t={t} />
    </Suspense>
  );
}

async function NowPlayingSection({ lang, t }: { lang: Locale; t: Strings }) {
  // MongoDB's driver reads the clock; defer its work until a request arrives.
  await connection();
  const games = await getPlayingGames();
  if (!games.length) return null;

  return (
    <section aria-labelledby="now-playing" className="flex flex-col w-full gap-10 px-6 pb-32 mx-auto pt-18 max-w-310">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <SectionHeading id="now-playing" index="01" first={t.now} second={t.playing} accent="acc" />
        <span className="bg-acc px-3 py-1.5 font-mono text-xs tracking-[0.16em] text-bg">
          {games.length} {games.length === 1 ? t.activeRun : t.activeRuns}
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-6 desk:grid-cols-2">
        {games.map((game, index) => (
          <li key={game.id}>
            <NowPlayingCard game={game} lang={lang} progressLabel={t.progress} bg={index % 2 ? "bg-acc2" : "bg-acc"} />
          </li>
        ))}
      </ul>
    </section>
  );
}
