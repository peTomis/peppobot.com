import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type CSSProperties } from "react";
import { tierOf, type Game } from "@/content/games";
import { localizePath, type Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getLatestReports } from "@/lib/games";
import { gameHref } from "./nav";
import { SectionHeading } from "./section-heading";
import { TranslatedText } from "./translated-text";

type Strings = Awaited<ReturnType<typeof getDictionary>>["latestReports"];

// One accent per card, in order.
const ACCENTS = ["var(--acc)", "var(--acc2)", "var(--acc3)"];

/** Home section 02: the three most recently completed games. */
export async function LatestReports() {
  const [lang, { latestReports: t }] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <Suspense>
      <LatestReportsSection lang={lang} t={t} />
    </Suspense>
  );
}

async function LatestReportsSection({ lang, t }: { lang: Locale; t: Strings }) {
  // MongoDB's driver reads the clock; defer its work until a request arrives.
  await connection();
  const games = await getLatestReports(ACCENTS.length);
  if (!games.length) return null;

  return (
    <section aria-labelledby="latest-reports" className="flex flex-col gap-10 px-6 pb-32 mx-auto w-full max-w-310">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <SectionHeading id="latest-reports" index="02" first={t.latest} second={t.reports} accent="acc2" />
        <Link
          href={localizePath("/library", lang)}
          className="bg-acc2 py-3.5 pr-7.5 pl-5.5 font-display text-sm font-bold tracking-[0.12em] text-bg uppercase [clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)] hover:bg-fg hover:text-bg"
        >
          {t.allReports}
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-7 desk:grid-cols-3">
        {games.map((game, index) => (
          <li key={game.id}>
            <ReportCard game={game} lang={lang} accent={ACCENTS[index]} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReportCard({ game, lang, accent }: { game: Game; lang: Locale; accent: string }) {
  const score = game.average != null ? new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(game.average) : "—";
  // Server-rendered, so pin the timezone: the date never depends on where the server runs.
  const date = game.finishedOn != null && new Intl.DateTimeFormat(lang, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(game.finishedOn);

  return (
    <Link href={gameHref(lang, game.id)} style={{ "--c": accent } as CSSProperties} className="flex flex-col gap-4.5 text-fg hover:text-fg motion-safe:transition-transform hover:-translate-y-1">
      <div
        aria-hidden
        className="relative grid aspect-[4/3] place-items-center bg-[repeating-linear-gradient(135deg,#2a1b40_0_10px,#170f24_10px_20px)] font-mono text-[10px] tracking-[0.1em] text-fg-faint [clip-path:polygon(0_0,100%_0,100%_calc(100%-36px),calc(100%-36px)_100%,0_100%)]"
      >
        {game.cover ? <Image src={game.cover} alt="" fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover" /> : "KEY ART"}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-(--c)" />
      </div>
      <div className="flex items-start gap-4">
        <div className="hex grid h-15.5 w-18 shrink-0 place-items-center bg-(--c) font-mono text-xl font-bold text-bg">{score}</div>
        <div className="flex flex-col min-w-0 gap-2">
          <div className="font-mono text-[11px] font-bold tracking-[0.14em] text-(--c) uppercase">
            {[game.average != null && tierOf(game.average).label, date].filter(Boolean).join(" · ")}
          </div>
          <h3 className="font-display text-2xl leading-[1.05] font-bold uppercase">{game.title}</h3>
          <TranslatedText text={game.description} lang={lang} className="text-[15px] leading-[1.55] text-pretty text-fg-muted" />
        </div>
      </div>
    </Link>
  );
}
