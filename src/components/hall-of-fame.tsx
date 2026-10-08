import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { GENRES, PLATFORMS } from "@/content/games";
import type { Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getNextInQueue, getTopRated } from "@/lib/games";
import { NextInQueueCard } from "./game-cards";
import { gameHref } from "./nav";
import { SectionHeading } from "./section-heading";

/** Home section 03: top-scored games, beside the next game not started yet. */
export async function HallOfFame() {
  const [lang, { hallOfFame: t }] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <section aria-labelledby="hall-of-fame" className="grid items-stretch w-full grid-cols-1 gap-10 px-6 pb-16 mx-auto max-w-310 desk:grid-cols-2">
      <div className="flex flex-col gap-7">
        <SectionHeading id="hall-of-fame" index="03" first={t.hallOf} second={t.fame} accent="acc" />
        <Suspense>
          <TopRated lang={lang} />
        </Suspense>
      </div>
      <Suspense>
        <NextInQueue lang={lang} label={t.nextInQueue} tba={t.tba} />
      </Suspense>
    </section>
  );
}

async function NextInQueue({ lang, label, tba }: { lang: Locale; label: string; tba: string }) {
  // MongoDB's driver reads the clock; defer its work until a request arrives.
  await connection();
  const next = await getNextInQueue();
  if (!next) return null;

  return <NextInQueueCard game={next} lang={lang} label={label} tba={tba} />;
}

async function TopRated({ lang }: { lang: Locale }) {
  // MongoDB's driver reads the clock; defer its work until a request arrives.
  await connection();
  const games = await getTopRated();
  const score = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <ol className="flex flex-col gap-1.5">
      {games.map((game, index) => (
        <li key={game.id}>
          <Link href={gameHref(lang, game.id)} className="grid grid-cols-[72px_minmax(0,1fr)_64px] items-center gap-4 py-2.5 text-fg hover:bg-surface hover:text-fg">
            <span
              aria-hidden
              className={`font-display text-[52px] leading-[0.9] font-bold text-transparent ${index % 2 ? "[-webkit-text-stroke:1.5px_var(--acc2)]" : "[-webkit-text-stroke:1.5px_var(--acc)]"}`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex flex-col min-w-0 gap-1">
              <h3 className="truncate font-display text-[22px] font-bold uppercase">{game.title}</h3>
              <div className="font-mono text-[11px] tracking-widest text-fg-dim uppercase">
                {GENRES[game.genre]?.name} · {PLATFORMS[game.platform]?.name}
              </div>
            </div>
            <div className={`hex grid h-13 w-15 place-items-center font-mono text-[17px] font-bold text-bg ${index % 2 ? "bg-acc2" : "bg-acc"}`}>
              {game.average != null ? score.format(game.average) : "—"}
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
