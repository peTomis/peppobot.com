import type { Metadata } from "next";
import Image from "next/image";
import { SectionHeading } from "@/components/section-heading";
import { GENRES_BY_NAME, TIERS } from "@/content/games";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { nav } = await getDictionary();
  return { title: nav.protocol, alternates: await localizedAlternates("/protocol") };
}

const ACCENTS = ["var(--acc)", "var(--acc2)", "var(--acc3)"];

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
            <tr className="grid grid-cols-3 gap-3 px-4.5 pb-2 font-mono text-[10px] font-bold tracking-[0.14em] text-fg-dim uppercase">
              <th scope="col" className="text-left">
                {t.genreAxesHead[0]}
              </th>
              <th scope="col" className="text-left text-acc2">
                04 · {t.genreAxesHead[1]}
              </th>
              <th scope="col" className="text-left text-acc">
                05 · {t.genreAxesHead[2]}
              </th>
            </tr>
          </thead>
          <tbody className="contents">
            {GENRES_BY_NAME.map((genre) => (
              <tr key={genre.id} className="grid grid-cols-3 items-center gap-3 bg-surface px-4.5 py-3.5 [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,0_100%)]">
                <th scope="row" className="text-left font-display text-[17px] leading-[1.1] font-bold text-fg uppercase">
                  {genre.name}
                </th>
                <td className="text-sm leading-[1.3] text-fg-muted">{t.genreAxes[genre.id][0]}</td>
                <td className="text-sm leading-[1.3] text-fg-muted">{t.genreAxes[genre.id][1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid items-start grid-cols-1 gap-16 desk:grid-cols-2">
        <section aria-labelledby="rating-tiers" className="flex flex-col gap-7">
          <SectionHeading id="rating-tiers" index="03" first={t.tiers[0]} second={t.tiers[1]} accent="acc" small />
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
          <SectionHeading id="about-pilot" index="04" first={t.about[0]} second={t.about[1]} accent="acc2" small />
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
    </main>
  );
}
