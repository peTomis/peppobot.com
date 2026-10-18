import type { Metadata } from "next";
import Image from "next/image";
import type { CSSProperties } from "react";
import { GACHA_STYLES } from "@/components/game-report";
import { SectionHeading } from "@/components/section-heading";
import { GACHA_LEVELS, GENRES_BY_NAME, TIERS } from "@/content/games";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/dictionaries";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { nav, meta } = await getDictionary();
  return pageMetadata("/protocol", { title: nav.protocol, description: meta.protocolDescription });
}

const ACCENTS = ["var(--acc)", "var(--acc2)", "var(--acc3)"];

/** Genre table columns from the desktop breakpoint; below it every cell takes a full row. */
const GENRE_COLUMNS = "desk:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,1fr)]";

/** Number and colour of the two genre axes, as in the score matrix. */
const GENRE_AXIS_HEADS = [
  { index: "04", color: "text-acc2" },
  { index: "05", color: "text-acc" },
] as const;

/** The pilot's hardware; names are the same in every language, the kind is translated. */
const DEVICES: { kind: keyof Dictionary["protocol"]["rig"]["kinds"]; name: string; specs?: string[] }[] = [
  { kind: "pc", name: "PC", specs: ["AMD Ryzen 7 7800X3D", "NVIDIA GeForce RTX 4090", "32 GB RAM", "ASUS ROG Swift OLED PG32UCDM · 4K 240 Hz"] },
  { kind: "console", name: "PlayStation 5" },
  { kind: "console", name: "Xbox Series S" },
  { kind: "hybrid", name: "Nintendo Switch 2" },
  { kind: "phone", name: "iPhone 18 Pro Max" },
  { kind: "phone", name: "OnePlus 15R" },
  { kind: "tablet", name: "iPad Pro 12.9″ M1" },
];

/** "9.0+", "8.0–8.9", … "0–4.9": each tier runs up to just below the one above it. */
function tierRange(index: number, one: Intl.NumberFormat) {
  const { min } = TIERS[index];
  if (index === 0) return `${one.format(min)}+`;
  return `${min === 0 ? "0" : one.format(min)}–${one.format(TIERS[index - 1].min - 0.1)}`;
}

// No runtime data: the whole page is prerendered per language.
export default async function ProtocolPage() {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const t = dict.protocol;
  const one = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <main className="flex flex-col flex-1 w-full gap-24 px-6 pt-10 pb-16 mx-auto max-w-310 desk:pt-18">
      <div className="flex flex-wrap items-end justify-between gap-10">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 font-mono text-xs tracking-[0.18em] text-acc">
            <span className="hex h-3 w-3.5 bg-acc" />
            {t.howScores}
          </div>
          <h1 className="flex flex-col items-start gap-2 font-display text-[clamp(56px,8vw,112px)] leading-[0.86] font-bold uppercase">
            <span className="text-fg">{t.title[0]}</span>
            <span className="translate-x-3.5 -rotate-3 bg-acc px-4.5 pt-1 text-bg">{t.title[1]}</span>
          </h1>
        </div>
        <p className="max-w-105 text-[17px] leading-[1.6] text-pretty text-fg-muted">{t.intro}</p>
      </div>

      <section aria-labelledby="six-axes" className="flex flex-col gap-8">
        <SectionHeading id="six-axes" index="01" first={t.axes[0]} second={t.axes[1]} accent="acc2" small />
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-3">
          {t.axisCards.map((axis, index) => (
            <li key={axis.name} className="flex flex-col gap-3.5 bg-surface p-7 [clip-path:polygon(0_0,calc(100%-28px)_0,100%_28px,100%_100%,0_100%)]">
              <span aria-hidden style={{ background: ACCENTS[index % 2] }} className="hex grid h-11.25 w-13 place-items-center font-mono text-[15px] font-bold text-bg">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-[26px] leading-none font-bold uppercase">{axis.name}</h3>
              <p className="text-[15px] leading-[1.6] text-fg-muted">{axis.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="genre-calibration" className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <SectionHeading id="genre-calibration" index="02" first={t.calibration.title[0]} second={t.calibration.title[1]} accent="acc" small />
          <p className="bg-acc p-9 text-[17px] leading-[1.6] font-medium text-pretty text-bg [clip-path:polygon(32px_0,100%_0,100%_calc(100%-32px),calc(100%-32px)_100%,0_100%,0_32px)]">
            {t.calibration.text}
          </p>
        </div>
        <table className="flex flex-col gap-1">
          <thead className="contents">
            <tr className={`hidden gap-x-6 px-4.5 pb-2 font-mono text-[10px] font-bold tracking-[0.14em] text-fg-dim uppercase desk:grid ${GENRE_COLUMNS}`}>
              <th scope="col" className="text-left">
                {t.genreAxesHead[0]}
              </th>
              {GENRE_AXIS_HEADS.map(({ index, color }, column) => (
                <th key={index} scope="col" className={`text-left ${color}`}>
                  {t.genreAxesHead[column + 1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="contents">
            {GENRES_BY_NAME.map((genre) => (
              <tr
                key={genre.id}
                className={`grid grid-cols-1 items-start gap-x-6 gap-y-4 bg-surface px-4.5 py-4 [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,0_100%)] ${GENRE_COLUMNS}`}
              >
                <th scope="row" className="text-left font-display text-[17px] leading-[1.1] font-bold text-fg uppercase">
                  {genre.name}
                </th>
                {t.genreAxes[genre.id].map((axis, column) => (
                  <td key={axis.name} className="flex flex-col gap-1">
                    {/* The column heads are hidden on phones, where the cells stack: each cell names its axis instead. */}
                    <span className={`font-mono text-[10px] font-bold tracking-[0.14em] uppercase desk:hidden ${GENRE_AXIS_HEADS[column].color}`}>
                      {GENRE_AXIS_HEADS[column].index} · {t.genreAxesHead[column + 1]}
                    </span>
                    <span className="text-[15px] leading-[1.3] font-bold text-fg">{axis.name}</span>
                    <span className="text-sm leading-normal text-pretty text-fg-muted">{axis.note}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="gacha-meter" className="grid items-start grid-cols-1 gap-8 desk:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] desk:gap-16">
        <div className="flex flex-col gap-6">
          <SectionHeading id="gacha-meter" index="03" first={t.gachaMeter.title[0]} second={t.gachaMeter.title[1]} accent="acc3" small />
          <p className="text-[17px] leading-[1.6] text-pretty text-fg-muted">{t.gachaMeter.text}</p>
        </div>
        <ul className="flex flex-col gap-2.5">
          {GACHA_LEVELS.map((level) => {
            const style = GACHA_STYLES[level];
            const strings = dict.report.gacha.levels[level - 1];
            return (
              <li key={level} style={{ "--c": style.color } as CSSProperties} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-5 bg-surface py-3.5 pr-5 pl-3.5">
                <span className="flex flex-col items-center justify-self-start -rotate-3 bg-(--c) px-3 py-1.5 font-mono font-bold text-bg">
                  <span className="text-[9px] tracking-[0.14em]">{t.gachaMeter.scale}</span>
                  <span className="text-sm">{style.count}</span>
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-display text-xl font-bold tracking-[0.08em] text-(--c)">
                    {style.icon} {strings.title}
                  </span>
                  <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-fg">{strings.type}</span>
                  <span className="mt-1 text-sm text-fg-muted">{t.gachaMeter.levelNotes[level - 1]}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid items-start grid-cols-1 gap-16 desk:grid-cols-2">
        <section aria-labelledby="rating-tiers" className="flex flex-col gap-7">
          <SectionHeading id="rating-tiers" index="04" first={t.tiers[0]} second={t.tiers[1]} accent="acc" small />
          <ul className="flex flex-col gap-2.5">
            {TIERS.map((tier, index) => (
              <li key={tier.label} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-5 bg-surface py-3.5 pr-5 pl-3.5">
                <span style={{ background: tier.color }} className="px-3 py-2 font-mono text-sm font-bold justify-self-start -rotate-3 text-bg">
                  {tierRange(index, one)}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span style={{ color: tier.color }} className="font-display text-xl font-bold tracking-[0.08em]">
                    {tier.label}
                  </span>
                  <span className="text-sm text-fg-muted">{t.tierNotes[tier.label]}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="about-pilot" className="flex flex-col gap-7">
          <SectionHeading id="about-pilot" index="05" first={t.about[0]} second={t.about[1]} accent="acc2" small />
          <div className="flex flex-col gap-5 bg-acc2 p-9 text-bg [clip-path:polygon(32px_0,100%_0,100%_calc(100%-32px),calc(100%-32px)_100%,0_100%,0_32px)]">
            <span className="grid hex h-20.75 w-24 place-items-center bg-bg">
              <Image draggable={false} src="/peppobot.png" alt="" width={56} height={56} className="invert mix-blend-screen" />
            </span>
            <p className="font-display text-[34px] leading-[0.95] font-bold uppercase">
              {t.aboutTitle[0]}
              <br />
              {t.aboutTitle[1]}
            </p>
            <div className="flex flex-col gap-3">
              {t.aboutText.map((paragraph) => (
                <p key={paragraph} className="text-base leading-[1.6] font-medium">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section aria-labelledby="test-bench" className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <SectionHeading id="test-bench" index="06" first={t.rig.title[0]} second={t.rig.title[1]} accent="acc" small />
          <p className="max-w-180 text-[17px] leading-[1.6] text-pretty text-fg-muted">{t.rig.text}</p>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3">
          {DEVICES.map((device, index) => (
            <li key={device.name} className="flex flex-col gap-2 bg-surface px-5 py-4.5 [clip-path:polygon(0_0,calc(100%-18px)_0,100%_18px,100%_100%,0_100%)]">
              <span style={{ color: ACCENTS[index % 2] }} className="font-mono text-[10px] font-bold tracking-[0.16em] uppercase">
                {t.rig.kinds[device.kind]}
              </span>
              <span className="font-display text-[22px] leading-[1.05] font-bold uppercase">{device.name}</span>
              {device.specs && (
                <ul className="flex flex-col gap-0.5 font-mono text-xs text-fg-muted">
                  {device.specs.map((spec) => (
                    <li key={spec}>{spec}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
