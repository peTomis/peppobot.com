import Image from "next/image";
import { connection } from "next/server";
import { Suspense } from "react";
import { getGames } from "@/lib/games";
import Link from "next/link";
import { localizePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { HomeMetrics } from "./home-metrics";
import { DotHex } from "./dot-hex";

const RING_TEXT = "PLAYING AND ENJOYING VIDEOGAMES ◆ SINCE 1999 ◆ PEPPOBOT ◆";

const ctaClass = "grid px-[30px] py-[18px] text-center font-display text-[15px] font-bold tracking-[0.12em] text-bg uppercase hover:bg-fg hover:text-bg";

export async function HomeHero() {
  const [lang, { hero: t }] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <>
      <section className="relative flex items-center z-1 min-h-170 overflow-x-clip bg-bg">
        {/* Hatched parallelogram under the badge; on mobile yellow, 2× wider, about half as tall, and lower */}
        <div
          aria-hidden
          className="absolute -bottom-24 h-26 w-[min(48vw,560px)] desk:-bottom-37.5 desk:h-55 desk:w-[min(24vw,280px)] bg-[repeating-linear-gradient(-45deg,#ffd65c_0_3px,transparent_3px_16px)] desk:bg-[repeating-linear-gradient(-45deg,var(--acc2)_0_3px,transparent_3px_16px)] [clip-path:polygon(25%_0,100%_0,75%_100%,0_100%)] right-[calc(max(-120px,-8vw)+min(64vw,760px)*0.22)] motion-safe:animate-bob-stripes"
        />

        {/* Big hexagon badge with the text ring */}
        <div aria-hidden className="absolute top-1/2 right-[max(-120px,-8vw)] grid aspect-[1.155] w-[min(64vw,760px)] -translate-y-1/2 place-items-center">
          <div className="relative grid col-start-1 row-start-1 size-full place-items-center motion-safe:animate-bob-hex">
            <div className="hex col-start-1 row-start-1 aspect-[1.155] w-full bg-acc2" />
            <div className="relative col-start-1 row-start-1 grid aspect-square w-[74%] place-items-center rounded-full">
              <svg viewBox="0 0 400 400" className="absolute inset-0 size-full origin-center motion-safe:animate-spin motion-safe:[animation-duration:30s] motion-safe:[animation-direction:reverse]">
                <defs>
                  <path id="hero-ring" d="M200,200 m-160,0 a160,160 0 1,1 320,0 a160,160 0 1,1 -320,0" />
                </defs>
                <text className="fill-white font-display text-[24px] font-bold tracking-[4px] uppercase">
                  <textPath href="#hero-ring" textLength="1000" lengthAdjust="spacing">
                    {RING_TEXT}
                  </textPath>
                </text>
              </svg>
              <Image src="/peppobot.png" alt="" width={400} height={400} priority className="relative h-auto w-[54%] invert mix-blend-screen" />
            </div>
            <div className="hidden desk:block absolute top-[6%] left-1/2 -translate-x-1/2 bg-acc px-3 py-1.5 font-mono text-xs tracking-[0.2em] whitespace-nowrap text-bg">PB-0001 // PILOT</div>
          </div>
          <DotHex fill="var(--acc)" className="absolute top-[90.4%] left-[8.3%] -z-10 h-auto w-[29.4%] overflow-visible motion-safe:animate-bob-dots" />
        </div>

        <div className="relative flex flex-col w-full px-6 pt-10 pb-8 mx-auto z-2 max-w-310 gap-7 desk:pt-18 desk:pb-24">
          <div className="flex items-center gap-3 font-mono text-xs tracking-[0.18em] text-acc">
            <span className="hex h-3 w-3.5 bg-acc" />
            {t.eyebrow}
          </div>
          <h1 className="flex flex-col items-start gap-2.5 font-display text-[clamp(52px,8vw,124px)] leading-[0.86] font-bold uppercase">
            <span className="text-fg">{t.titleGames}</span>
            <span className="translate-x-4.5 -rotate-3 bg-acc px-4.5 pt-1 text-bg">{t.titlePlayed}</span>
            <span className="text-transparent [-webkit-text-stroke:2px_var(--acc2)]">{t.titleReports}</span>
            <span className="text-acc2">{t.titleFiled}</span>
          </h1>
          <p className="max-w-[min(440px,40vw)] text-lg leading-[1.6] text-pretty text-fg-soft">{t.intro}</p>
          {/* Mobile: staggered, library left and protocol right. */}
          <div className="flex flex-col gap-3 mt-12 desk:mt-0 desk:flex-row desk:flex-wrap">
            <Link href={localizePath("/library", lang)} className={`${ctaClass} self-start bg-acc [clip-path:polygon(0_0,calc(100%-16px)_0,100%_50%,calc(100%-16px)_100%,0_100%)]`}>
              <CtaLabel label={t.openLibrary} other={t.scoringProtocol} />
            </Link>
            <Link href={localizePath("/protocol", lang)} className={`${ctaClass} self-end bg-acc2 desk:self-start [clip-path:polygon(16px_0,100%_0,100%_100%,16px_100%,0_50%)]`}>
              <CtaLabel label={t.scoringProtocol} other={t.openLibrary} />
            </Link>
          </div>
          <HomeMetrics lang={lang} loggedLabel={t.kpiLogged} hoursLabel={t.kpiHours} averageLabel={t.kpiAvgScore} />
        </div>
      </section>

      <Suspense fallback={<Tickers words={t.ticker} purple={[]} green={[]} />}>
        <GameTickers words={t.ticker} />
      </Suspense>
    </>
  );
}

/**
 * Both buttons size to the longer of the two labels: the other label sits
 * invisibly in the same grid cell, so their widths always match.
 */
function CtaLabel({ label, other }: { label: string; other: string }) {
  return (
    <>
      <span className="col-start-1 row-start-1">{label}</span>
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {other}
      </span>
    </>
  );
}

async function GameTickers({ words }: { words: string[] }) {
  // MongoDB's driver reads the clock; defer its work until a request arrives.
  await connection();
  const titles = (await getGames()).map((game) => game.title);
  // A fresh order per request, independent for each band.
  return <Tickers words={words} purple={shuffle(titles)} green={shuffle(titles)} />;
}

/** Fisher–Yates shuffle into a new array. */
function shuffle<T>(items: T[]) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Two decorative game-title bands; slogans fill the loading state. */
function Tickers({ words, purple, green }: { words: string[]; purple: string[]; green: string[] }) {
  const band = "absolute -inset-x-[5%] overflow-hidden py-3.5 font-display text-[22px] font-bold tracking-[0.14em] whitespace-nowrap text-bg uppercase";

  return (
    <div aria-hidden className="pointer-events-none relative z-2 mb-12 h-37.5 overflow-x-clip">
      <div className={`${band} top-8.5 rotate-2 bg-acc2`}>
        <TickerTrack items={purple} reverse />
      </div>
      <div className={`${band} top-14.5 -rotate-2 bg-acc`}>
        <TickerTrack items={green.length ? green : words} triangle />
      </div>
    </div>
  );
}

function TickerTrack({ items, reverse = false, triangle = false }: { items: string[]; reverse?: boolean; triangle?: boolean }) {
  // Two identical groups keep the wrap seamless; each covers at least the band.
  const repeated = Array.from({ length: Math.max(1, Math.ceil(8 / (items.length || 1))) }, () => items).flat();

  return (
    <div className={`flex w-max motion-safe:animate-ticker ${reverse ? "motion-safe:[animation-direction:reverse]" : ""}`}>
      {[0, 1].map((copy) => (
        <div key={copy} className="flex min-w-[110vw] shrink-0 items-center justify-around gap-8 pr-8">
          {repeated.map((item, index) => (
            <span key={index} className="flex shrink-0 items-center gap-8">
              {item}
              <span className={triangle ? "size-0 shrink-0 border-x-8 border-b-14 border-x-transparent border-b-bg" : "size-3 shrink-0 rotate-45 bg-bg"} />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
