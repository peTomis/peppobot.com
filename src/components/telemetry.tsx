import { connection } from "next/server";
import type { CSSProperties } from "react";
import { GENRES, TIERS } from "@/content/games";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getData } from "@/lib/data";
import { PlatformLogo } from "./platform-logo";
import { Radar } from "./radar";
import { SectionHeading } from "./section-heading";

type Strings = Dictionary["telemetry"];

const ACCENTS = ["var(--acc)", "var(--acc2)", "var(--acc3)"];
const bar = "[clip-path:polygon(0_0,100%_0,calc(100%-10px)_100%,0_100%)]";

// Both parts read the precomputed `data` document; getData() is cached, so it is one lookup.
async function load(lang: Locale) {
  // MongoDB's driver reads the clock; defer its work until a request arrives.
  await connection();
  const data = await getData();
  return { data, number: new Intl.NumberFormat(lang), one: new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) };
}

/** Headline figures under the page title. */
export async function TelemetryKpis({ lang, t }: { lang: Locale; t: Strings }) {
  const { data, number, one } = await load(lang);
  const kpis = [
    { label: t.kpis.logged, value: number.format(data.count), color: "var(--acc)" },
    { label: t.kpis.hours, value: number.format(data.hours), color: "var(--acc2)" },
    { label: t.kpis.completed, value: number.format(data.completed), color: "var(--acc3)" },
    { label: t.kpis.avgScore, value: data.avgScore != null ? one.format(data.avgScore) : "—", color: "var(--fg)" },
  ];

  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          style={{ background: kpi.color }}
          className="flex flex-col-reverse gap-2.5 px-6.5 py-6 font-mono font-bold text-bg [clip-path:polygon(0_0,calc(100%-24px)_0,100%_24px,100%_100%,0_100%)]"
        >
          <dt className="text-[11px] tracking-[0.16em]">{kpi.label}</dt>
          <dd className="text-[56px] leading-[0.9]">{kpi.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Profile radar, tier and platform bars, genre hexagons. */
export async function TelemetrySections({ lang, t, axisNames }: { lang: Locale; t: Strings; axisNames: string[] }) {
  const { data, number, one } = await load(lang);
  const plural = new Intl.PluralRules(lang);
  const maxTier = Math.max(0, ...data.tiers);
  const maxHours = Math.max(0, ...data.platformHours.map((row) => row.hours));

  return (
    <>
      <section aria-labelledby="pilot-profile" className="grid items-center grid-cols-1 gap-16 desk:grid-cols-2">
        <div className="flex flex-col gap-6">
          <SectionHeading id="pilot-profile" index="01" first={t.profile[0]} second={t.profile[1]} accent="acc3" small />
          <p className="bg-acc3 p-9 text-[17px] leading-[1.6] font-medium text-pretty text-bg [clip-path:polygon(32px_0,100%_0,100%_calc(100%-32px),calc(100%-32px)_100%,0_100%,0_32px)]">
            {t.profileIntro}
          </p>
          <dl className="grid grid-cols-2 gap-2">
            {axisNames.map((name, index) => (
              <div key={name} className="flex items-center justify-between px-4 py-3 bg-surface">
                <dt className="font-mono text-[11px] tracking-[0.12em] text-fg-dim uppercase">{name}</dt>
                <dd className="font-mono text-lg font-bold">{data.axes[index] != null ? one.format(data.axes[index]) : "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
        <Radar values={data.axes} labels={axisNames} format={one} />
      </section>

      <div className="grid grid-cols-1 gap-16 desk:grid-cols-2">
        <section aria-labelledby="rating-tiers" className="flex flex-col gap-7">
          <SectionHeading id="rating-tiers" index="02" first={t.tiers[0]} second={t.tiers[1]} accent="acc" small />
          <ul className="flex flex-col gap-2.5">
            {TIERS.map((tier, index) => {
              const count = data.tiers[index] ?? 0;
              return (
                <li key={tier.label} style={{ "--c": tier.color } as CSSProperties} className="grid grid-cols-[130px_minmax(0,1fr)_36px] items-center gap-3.5">
                  <span className="font-display text-sm font-bold tracking-widest text-(--c)">{tier.label}</span>
                  <div className={`h-7 bg-surface ${bar}`}>
                    <div style={{ width: `${maxTier ? (count / maxTier) * 100 : 0}%` }} className={`h-full bg-(--c) ${bar}`} />
                  </div>
                  <span className="font-mono text-lg font-bold text-right">{number.format(count)}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="platform-hours" className="flex flex-col gap-7">
          <SectionHeading id="platform-hours" index="03" first={t.platforms[0]} second={t.platforms[1]} accent="acc2" small />
          {/* The logo column is as wide as the widest logo shown; the bars take the rest. */}
          <ul className="grid grid-cols-[max-content_minmax(0,1fr)_max-content] gap-x-3.5 gap-y-2.5">
            {data.platformHours.map((row) => (
              <li key={row.platform} className="grid items-center col-span-3 grid-cols-subgrid">
                <span className="flex items-center text-sm font-bold tracking-widest uppercase font-display">
                  <PlatformLogo platform={row.platform} />
                </span>
                <div className={`h-7 bg-surface ${bar}`}>
                  <div style={{ width: `${maxHours ? (row.hours / maxHours) * 100 : 0}%` }} className={`h-full bg-acc2 ${bar}`} />
                </div>
                <span className="font-mono text-base font-bold text-right">{number.format(row.hours)}h</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="genre-scan" className="flex flex-col gap-7">
        <SectionHeading id="genre-scan" index="04" first={t.genres[0]} second={t.genres[1]} accent="acc" small />
        <ul className="grid grid-cols-2 gap-x-4 gap-y-7 desk:grid-cols-[repeat(auto-fill,minmax(min(100%,180px),1fr))]">
          {data.genres.map((genre, index) => (
            <li key={genre.genre} className="flex flex-col items-center gap-3 text-center">
              <div style={{ background: ACCENTS[index % 2] }} className="flex flex-col items-center justify-center font-mono font-bold hex h-26 w-30 text-bg">
                <span className="text-[30px] leading-none">{one.format(genre.avgScore)}</span>
                <span className="text-[10px] tracking-[0.14em]">
                  {number.format(genre.count)} {t.games[plural.select(genre.count) === "one" ? "one" : "other"]}
                </span>
              </div>
              <span className="font-display text-[17px] font-bold tracking-[0.06em] uppercase">{GENRES[genre.genre]?.name}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
