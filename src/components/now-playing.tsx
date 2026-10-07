import { connection } from "next/server";
import { Suspense } from "react";
import { PLATFORMS, type Game } from "@/content/games";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getPlayingGames } from "@/lib/games";
import { gameHref } from "./nav";
import { SectionHeading } from "./section-heading";
import { TranslatedText } from "./translated-text";

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

function NowPlayingCard({ game, lang, progressLabel, bg }: { game: Game; lang: Locale; progressLabel: string; bg: string }) {
  const progress = game.progress ?? 0;

  return (
    <Link
      href={gameHref(lang, game.id)}
      className={`flex h-full gap-6 p-6 text-bg hover:text-bg hover:brightness-108 [clip-path:polygon(0_0,calc(100%-40px)_0,100%_40px,100%_100%,0_100%)] ${bg}`}
    >
      <div aria-hidden className="grid w-32 shrink-0 aspect-[3/4] place-items-center self-start bg-bg p-1.5 text-center font-mono text-[9px] tracking-[0.08em] text-fg-dim">
        COVER ART
      </div>
      <div className="flex flex-col flex-1 min-w-0 gap-2.5">
        <div className="font-mono text-[11px] font-bold tracking-[0.14em] uppercase">
          {PLATFORMS[game.platform]?.name} · {game.genre}
        </div>
        <h3 className="font-display text-[28px] leading-none font-bold uppercase">{game.title}</h3>
        <TranslatedText text={game.description} lang={lang} className="text-[15px] leading-[1.45] font-medium" />
        <div className="flex items-end gap-4 mt-auto">
          <div className="flex flex-col flex-1 gap-1.5">
            <div className="font-mono text-[11px] font-bold tracking-[0.12em]">
              {progressLabel} {progress}%
            </div>
            <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={game.title} className="h-2.5 bg-bg/20">
              <div className="h-full bg-bg" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="font-mono text-[34px] leading-[0.9] font-bold">
            {game.hours}
            <span className="text-sm">H</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
