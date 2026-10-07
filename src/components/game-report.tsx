import Link from "next/link";
import type { CSSProperties } from "react";
import { PLATFORMS, releaseYear, STATUS_COLORS, tierOf, type GameReport as Report, type ReportLink, type Scores } from "@/content/games";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Translated } from "@/i18n/translations";
import { DotHex } from "./dot-hex";
import { gameHref } from "./nav";
import { PlatformLogo } from "./platform-logo";
import { SectionHeading } from "./section-heading";
import { TranslatedText } from "./translated-text";

type Strings = Dictionary["report"];
type Statuses = Dictionary["library"]["statuses"];

const placeholder = "grid place-items-center bg-[repeating-linear-gradient(135deg,#2a1b40_0_12px,#170f24_12px_24px)] p-4 text-center font-mono text-[11px] tracking-[0.12em] text-fg-dim uppercase";

/** Full game report: hero, score matrix, written report with pilot data, and neighbouring reports. */
export function GameReport({ report, lang, t, statuses }: { report: Report; lang: Locale; t: Strings; statuses: Statuses }) {
  const { game } = report;
  const one = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const tier = game.average != null ? tierOf(game.average) : null;
  const statusColor = STATUS_COLORS[game.status];
  const platform = PLATFORMS[game.platform] ? <PlatformLogo platform={game.platform} /> : null;
  const year = releaseYear(game);
  const logged = game.finishedOn != null && new Intl.DateTimeFormat(lang, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(game.finishedOn);
  const hasReport = Boolean(game.pros?.length || game.cons?.length);

  const data = [
    { k: t.rows.status, v: statuses[game.status] },
    { k: t.rows.platform, v: platform },
    { k: t.rows.developer, v: game.dev },
    { k: t.rows.playtime, v: `${game.hours} h` },
    { k: t.rows.released, v: year },
    { k: t.rows.logged, v: logged },
    { k: t.rows.progress, v: game.progress != null ? `${game.progress}%` : null },
    { k: t.rows.tier, v: tier?.label },
  ].filter((row) => row.v != null && row.v !== false);

  // Section numbers follow what is shown.
  let section = 0;
  const nextIndex = () => String(++section).padStart(2, "0");

  return (
    <div className="flex flex-col gap-24">
      <div className="flex flex-col gap-10">
        <Link
          href={localizePath("/library", lang)}
          className="self-start bg-surface py-2.5 pr-4.5 pl-6.5 font-display text-[13px] font-bold tracking-[0.14em] text-fg uppercase [clip-path:polygon(12px_0,100%_0,100%_100%,12px_100%,0_50%)] hover:bg-acc2 hover:text-bg"
        >
          {t.back} #{String(report.number).padStart(3, "0")}
        </Link>

        <div className="flex flex-wrap items-center gap-14">
          <div className="relative isolate flex-[0_0_min(100%,340px)]">
            <div aria-hidden className={`relative aspect-[3/4] ${placeholder} [clip-path:polygon(0_0,100%_0,100%_calc(100%-48px),calc(100%-48px)_100%,0_100%)]`}>
              COVER ART
              <div style={{ background: statusColor }} className="absolute bottom-0 left-0 w-full h-2.5" />
            </div>
            <div
              style={tier ? ({ "--c": tier.color } as CSSProperties) : undefined}
              className={`hex absolute -top-7 right-0 flex desk:-right-7 h-32.5 w-37.5 flex-col items-center justify-center font-mono font-bold ${tier ? "bg-(--c) text-bg" : "bg-surface-hover text-fg-dim"}`}
            >
              <span className="text-[46px] leading-none">{game.average != null ? one.format(game.average) : "—"}</span>
              <span className="text-[10px] tracking-[0.16em]">{t.outOf}</span>
            </div>
            <DotHex fill="var(--acc)" className="absolute -bottom-8 -left-6 -z-1 h-auto w-27.5" />
          </div>

          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-6">
            <div className="flex flex-wrap gap-2 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
              {platform && <span className="flex items-center bg-surface px-3 py-1.75 text-fg-muted">{platform}</span>}
              {[game.genre, year].filter(Boolean).map((chip) => (
                <span key={String(chip)} className="bg-surface px-3 py-1.75 text-fg-muted">
                  {chip}
                </span>
              ))}
              <span style={{ background: statusColor }} className="px-3 py-1.75 text-bg">
                {statuses[game.status]}
              </span>
            </div>
            <h1 className="font-display text-[clamp(44px,6vw,88px)] leading-[0.9] font-bold text-balance text-fg uppercase">{game.title}</h1>
            <div className="font-display text-base font-semibold tracking-widest text-fg-dim uppercase">
              {t.by} {game.dev}
            </div>
            <TranslatedText text={game.description} lang={lang} quoted className="font-display text-[clamp(22px,2.4vw,30px)] leading-[1.3] font-medium text-pretty text-fg" />
            <div className="flex flex-wrap items-center gap-4">
              {tier && (
                <span style={{ background: tier.color }} className="-rotate-3 px-4.5 py-2.5 font-display text-[22px] font-bold tracking-[0.14em] text-bg">
                  {tier.label}
                </span>
              )}
              {game.status === "Playing" && (
                <span className="font-mono text-xs font-bold tracking-[0.12em] text-acc3">
                  {t.inProgress} {game.progress ?? 0}%
                </span>
              )}
              {game.status === "Not Started" && <span className="font-mono text-xs font-bold tracking-[0.12em] text-fg-dim">{t.notStarted}</span>}
            </div>
          </div>
        </div>
      </div>

      {game.scores && (
        <section aria-labelledby="score-matrix" className="flex flex-col gap-10">
          <SectionHeading id="score-matrix" index={nextIndex()} first={t.scoreMatrix[0]} second={t.scoreMatrix[1]} accent="acc2" small />
          <div className="grid grid-cols-1 items-center gap-16 desk:grid-cols-2">
            <Radar scores={game.scores} t={t} one={one} />
            <ul className="flex flex-col gap-4.5">
              {game.scores.map((value, index) => (
                <li key={index} className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-lg font-bold tracking-[0.08em] uppercase">{t.axes[index].name}</span>
                    <span className="font-mono text-lg font-bold">{one.format(value)}</span>
                  </div>
                  <div className="h-5.5 bg-surface [clip-path:polygon(0_0,100%_0,calc(100%-8px)_100%,0_100%)]">
                    <div
                      style={{ width: `${value * 10}%` }}
                      className={`h-full [clip-path:polygon(0_0,100%_0,calc(100%-8px)_100%,0_100%)] ${index % 2 ? "bg-acc2" : "bg-acc"}`}
                    />
                  </div>
                  <p className="text-[13px] leading-normal text-fg-dim">{t.axes[index].note}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-14 desk:flex-row desk:items-start">
        {hasReport && (
          <article aria-labelledby="full-report" className="flex min-w-0 flex-1 flex-col gap-8">
            <SectionHeading id="full-report" index={nextIndex()} first={t.fullReport[0]} second={t.fullReport[1]} accent="acc" small />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-3 pt-2">
              {game.pros?.length ? <Verdicts title={t.pros} items={game.pros} lang={lang} className="bg-acc" /> : null}
              {game.cons?.length ? <Verdicts title={t.cons} items={game.cons} lang={lang} className="bg-acc3" /> : null}
            </div>
          </article>
        )}
        <aside className={`flex flex-col gap-1 bg-acc2 p-7 text-bg [clip-path:polygon(28px_0,100%_0,100%_100%,0_100%,0_28px)] ${hasReport ? "desk:sticky desk:top-24 desk:w-80 desk:shrink-0" : "desk:w-full"}`}>
          <span className="pb-2.5 font-display text-[22px] font-bold tracking-[0.06em] uppercase">{t.pilotData}</span>
          <dl className="contents">
            {data.map((row) => (
              <div key={row.k} className="flex justify-between gap-3 bg-bg/12 px-3 py-2.5 font-mono text-xs font-bold">
                <dt className="tracking-[0.12em]">{row.k}</dt>
                <dd className="flex items-center justify-end text-right uppercase">{row.v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>

      {(report.prev || report.next) && (
        <nav className="grid grid-cols-1 gap-3 desk:grid-cols-2">
          {report.prev ? <Neighbour link={report.prev} label={t.previous} lang={lang} direction="prev" /> : <span className="hidden desk:block" />}
          {report.next && <Neighbour link={report.next} label={t.next} lang={lang} direction="next" />}
        </nav>
      )}
    </div>
  );
}

const R = 105;

/** Corner `i` of the hexagonal radar at radius `r`, in a 300×300 box. */
function point(i: number, r: number) {
  const angle = -Math.PI / 2 + (i * Math.PI) / 3;
  return [150 + r * Math.cos(angle), 150 + r * Math.sin(angle)] as const;
}

const polygon = (radii: number[]) => radii.map((r, i) => point(i, r).map((n) => n.toFixed(1)).join(",")).join(" ");

function Radar({ scores, t, one }: { scores: Scores; t: Strings; one: Intl.NumberFormat }) {
  const rings = [5, 4, 3, 2, 1].map((k) => polygon(Array(6).fill((R * k) / 5)));
  const axes = scores.map((_, i) => `M150 150 L${point(i, R).map((n) => n.toFixed(1)).join(" ")}`).join(" ");

  return (
    <div className="relative mx-auto aspect-square w-[calc(100%-64px)] max-w-120">
      <svg viewBox="0 0 300 300" aria-hidden className="absolute inset-0 overflow-visible size-full">
        {rings.map((points, index) => (
          <polygon key={index} points={points} className={`stroke-line ${index ? "fill-none" : "fill-surface"}`} />
        ))}
        <path d={axes} className="stroke-line" />
        <polygon points={polygon(scores.map((value) => (R * value) / 10))} className="fill-acc2/80 stroke-acc2 stroke-2 [stroke-linejoin:round]" />
      </svg>
      {scores.map((value, i) => {
        const [x, y] = point(i, R + 34);
        return (
          <div key={i} style={{ left: `${x / 3}%`, top: `${y / 3}%` }} className="absolute flex flex-col items-center gap-0.5 font-display font-bold whitespace-nowrap -translate-x-1/2 -translate-y-1/2">
            <span className="text-[13px] tracking-widest text-fg-muted uppercase">{t.axes[i].name}</span>
            <span className="text-[22px] leading-none text-acc">{one.format(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

function Verdicts({ title, items, lang, className }: { title: string; items: Translated[]; lang: Locale; className: string }) {
  return (
    <div className={`flex flex-col gap-3.5 p-6.5 text-bg [clip-path:polygon(0_0,calc(100%-24px)_0,100%_24px,100%_100%,0_100%)] ${className}`}>
      <span className="font-display text-[22px] font-bold tracking-[0.06em] uppercase">{title}</span>
      <ul className="flex flex-col gap-3.5">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2.5 text-[15px] leading-[1.45] font-semibold">
            <span aria-hidden>▸</span>
            <TranslatedText text={item} lang={lang} as="span" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Neighbour({ link, label, lang, direction }: { link: ReportLink; label: string; lang: Locale; direction: "prev" | "next" }) {
  const prev = direction === "prev";
  return (
    <Link
      href={gameHref(lang, link.id)}
      className={`flex flex-col gap-2 bg-surface py-6 text-fg hover:bg-surface-hover hover:text-fg ${
        prev ? "pr-6 pl-11 [clip-path:polygon(24px_0,100%_0,100%_100%,24px_100%,0_50%)]" : "pr-11 pl-6 text-right [clip-path:polygon(0_0,calc(100%-24px)_0,100%_50%,calc(100%-24px)_100%,0_100%)]"
      }`}
    >
      <span className={`font-mono text-[11px] font-bold tracking-[0.14em] ${prev ? "text-acc2" : "text-acc"}`}>{label}</span>
      <span className="font-display text-[22px] font-bold uppercase">{link.title}</span>
    </Link>
  );
}
