import Image from "next/image";
import Link from "next/link";
import { GAMES, libraryStats } from "@/content/games";
import { localizePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { DotHex } from "./dot-hex";

const RING_TEXT = "PLAYING AND ENJOYING VIDEOGAMES ◆ SINCE 1999 ◆ PEPPOBOT ◆";

const ctaClass = "grid px-[30px] py-[18px] text-center font-display text-[15px] font-bold tracking-[0.12em] text-bg uppercase hover:bg-fg hover:text-bg";

export async function HomeHero() {
  const [lang, { hero: t }] = await Promise.all([getLocale(), getDictionary()]);
  const stats = libraryStats();
  const oneDecimal = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const kpis = [
    { value: stats.count, label: t.kpiLogged, bg: "bg-acc" },
    { value: stats.hours, label: t.kpiHours, bg: "bg-acc2" },
    { value: oneDecimal.format(stats.avgScore), label: t.kpiAvgScore, bg: "bg-acc3" },
  ];

  return (
    <>
      <section className="relative flex items-center z-1 min-h-170 overflow-x-clip bg-bg">
        {/* Hatched parallelogram under the badge; on mobile 2× wider, ⅓ shorter, same top edge */}
        <div
          aria-hidden
          className="absolute -bottom-19.25 h-36.75 w-[min(48vw,560px)] desk:-bottom-37.5 desk:h-55 desk:w-[min(24vw,280px)] bg-[repeating-linear-gradient(-45deg,var(--acc2)_0_3px,transparent_3px_16px)] [clip-path:polygon(25%_0,100%_0,75%_100%,0_100%)] right-[calc(max(-120px,-8vw)+min(64vw,760px)*0.22)] motion-safe:animate-bob-stripes"
        />

        {/* Big hexagon badge with the text ring */}
        <div aria-hidden className="absolute top-1/2 right-[max(-120px,-8vw)] grid aspect-[1.155] w-[min(64vw,760px)] -translate-y-1/2 place-items-center">
          <div className="relative grid col-start-1 row-start-1 size-full place-items-center motion-safe:animate-bob-hex">
            <div className="hex col-start-1 row-start-1 aspect-[1.155] w-full bg-acc2" />
            <div className="relative col-start-1 row-start-1 grid aspect-square w-[74%] place-items-center rounded-full">
              <svg viewBox="0 0 400 400" className="absolute inset-0 size-full">
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
            <div className="absolute top-[6%] left-1/2 -translate-x-1/2 bg-acc px-3 py-1.5 font-mono text-xs tracking-[0.2em] whitespace-nowrap text-bg">PB-0001 // PILOT</div>
          </div>
          <DotHex fill="var(--acc)" className="absolute top-[90.4%] left-[8.3%] -z-10 h-auto w-[29.4%] overflow-visible motion-safe:animate-bob-dots" />
        </div>

        <div className="relative flex flex-col w-full px-6 pt-10 pb-8 mx-auto z-2 max-w-310 gap-7 desk:pt-24 desk:pb-24">
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
          <dl className="grid grid-cols-3 pt-2 desk:flex desk:flex-wrap">
            {kpis.map((kpi) => (
              <div key={kpi.label} className={`flex min-w-0 flex-col-reverse gap-1 px-3 py-4 text-bg desk:min-w-30 desk:px-5.5 ${kpi.bg}`}>
                <dt className="font-mono text-[clamp(8px,2.4vw,10px)] tracking-[0.12em] desk:text-[10px] desk:tracking-[0.16em]">{kpi.label}</dt>
                <dd className="font-mono text-[clamp(22px,7vw,30px)] leading-none font-bold desk:text-[30px]">{kpi.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Tickers words={t.ticker} />
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

/** Two tilted bands: game titles, then the site's slogans. Decorative. */
function Tickers({ words }: { words: string[] }) {
  const band = "absolute -inset-x-[5%] flex gap-8 py-3.5 font-display text-[22px] font-bold tracking-[0.14em] whitespace-nowrap text-bg uppercase";
  const titles = [...GAMES, ...GAMES].map((g) => g.title);
  const slogans = Array.from({ length: 4 }, () => words).flat();

  return (
    <div aria-hidden className="pointer-events-none relative z-2 mb-12 h-37.5 overflow-x-clip">
      <div className={`${band} top-8.5 rotate-2 bg-acc2`}>
        {titles.map((title, i) => (
          <span key={i} className="flex items-center gap-8">
            {title}
            <span className="rotate-45 size-3 bg-bg" />
          </span>
        ))}
      </div>
      <div className={`${band} top-14.5 -rotate-2 bg-acc`}>
        {slogans.map((word, i) => (
          <span key={i} className="flex items-center gap-8">
            {word}
            <span className="size-0 border-x-8 border-b-14 border-x-transparent border-b-bg" />
          </span>
        ))}
      </div>
    </div>
  );
}
