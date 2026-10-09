import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { GENRES, PLATFORMS, releaseYear, STATUS_COLORS, tierOf, type Game, type GameStatus } from "@/content/games";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { DotHex, DotHexImage } from "./dot-hex";
import { gameHref } from "./nav";
import { PlatformLogo } from "./platform-logo";
import { TranslatedText } from "./translated-text";

// Game cards with no data loading of their own, so the maker's image preview renders the same ones as the site.

type LibraryStrings = Dictionary["library"];

export function ScoreHex({ game, score, className }: { game: Game; score: Intl.NumberFormat; className: string }) {
  const { average } = game;
  if (average == null) {
    return <div className={`hex grid place-items-center bg-surface-hover font-mono font-bold text-fg-dim ${className}`}>—</div>;
  }
  return (
    <div style={{ "--c": tierOf(average).color } as CSSProperties} className={`hex grid place-items-center bg-(--c) font-mono font-bold text-bg ${className}`}>
      {score.format(average)}
    </div>
  );
}

export function StatusTag({ status, t, className = "" }: { status: GameStatus; t: LibraryStrings; className?: string }) {
  return (
    <span style={{ "--c": STATUS_COLORS[status] } as CSSProperties} className={`bg-(--c) px-2.5 py-1.25 font-mono text-[10px] font-bold tracking-[0.14em] text-bg uppercase ${className}`}>
      {t.statuses[status]}
    </span>
  );
}

/** Library grid item. */
export function GridCard({ game, lang, score, t }: { game: Game; lang: Locale; score: Intl.NumberFormat; t: LibraryStrings }) {
  const meta = [GENRES[game.genre]?.name, releaseYear(game) ?? t.tba].filter(Boolean).join(" · ");
  return (
    // The link stays put and only its content lifts: a lifting link would leave the cursor at its bottom edge and flicker.
    <Link href={gameHref(lang, game.id)} className="group block text-fg hover:text-fg">
      <div className="flex flex-col gap-4 motion-safe:transition-transform group-hover:-translate-y-1">
        <div className="relative">
          <div
            aria-hidden
            className="relative grid aspect-[3/4] place-items-center bg-[repeating-linear-gradient(135deg,#2a1b40_0_10px,#170f24_10px_20px)] p-3 text-center font-mono text-[10px] tracking-[0.1em] text-fg-faint [clip-path:polygon(0_0,100%_0,100%_calc(100%-32px),calc(100%-32px)_100%,0_100%)]"
          >
            {game.cover ? <Image draggable={false} src={game.cover} alt="" fill sizes="(min-width: 1024px) 240px, 50vw" className="object-cover" /> : "COVER ART"}
            <div style={{ background: STATUS_COLORS[game.status] }} className="absolute bottom-0 left-0 w-full h-2" />
          </div>
          <ScoreHex game={game} score={score} className="absolute -top-3 -right-2.5 h-13.5 w-15.5 text-[17px]" />
          <StatusTag status={game.status} t={t} className="absolute left-0 top-3.5" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-xl leading-[1.05] font-bold uppercase">{game.title}</h2>
          <div className="flex flex-wrap items-center gap-x-2 font-mono text-[11px] tracking-widest text-fg-dim uppercase">
            {PLATFORMS[game.platform] && (
              <>
                <PlatformLogo platform={game.platform} className="h-3" />
                {meta && <span aria-hidden>·</span>}
              </>
            )}
            {meta}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Home "Now playing" card. */
export function NowPlayingCard({ game, lang, progressLabel, bg }: { game: Game; lang: Locale; progressLabel: string; bg: string }) {
  const progress = game.progress ?? 0;

  return (
    <Link
      href={gameHref(lang, game.id)}
      className={`flex h-full gap-6 p-6 text-bg hover:text-bg hover:brightness-108 [clip-path:polygon(0_0,calc(100%-40px)_0,100%_40px,100%_100%,0_100%)] ${bg}`}
    >
      <div aria-hidden className="relative grid w-32 shrink-0 aspect-[3/4] place-items-center self-start bg-bg p-1.5 text-center font-mono text-[9px] tracking-[0.08em] text-fg-dim">
        {game.cover ? <Image draggable={false} src={game.cover} alt="" fill sizes="128px" className="object-cover" /> : "COVER ART"}
      </div>
      <div className="flex flex-col flex-1 min-w-0 gap-2.5">
        <div className="flex flex-wrap items-center gap-x-2 font-mono text-[11px] font-bold tracking-[0.14em] uppercase">
          {PLATFORMS[game.platform] && (
            <>
              <PlatformLogo platform={game.platform} className="h-3" />
              {GENRES[game.genre] && <span aria-hidden>·</span>}
            </>
          )}
          {GENRES[game.genre]?.name}
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

/** Home "Latest reports" card. */
export function ReportCard({ game, lang, accent }: { game: Game; lang: Locale; accent: string }) {
  const score = game.average != null ? new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(game.average) : "—";
  // Server-rendered, so pin the timezone: the date never depends on where the server runs.
  const date = game.finishedOn != null && new Intl.DateTimeFormat(lang, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(game.finishedOn);

  return (
    // The link stays put and only its content lifts: a lifting link would leave the cursor at its bottom edge and flicker.
    <Link href={gameHref(lang, game.id)} style={{ "--c": accent } as CSSProperties} className="group block text-fg hover:text-fg">
      <div className="flex flex-col gap-4.5 motion-safe:transition-transform group-hover:-translate-y-1">
        <div
          aria-hidden
          className="relative grid aspect-[4/3] place-items-center bg-[repeating-linear-gradient(135deg,#2a1b40_0_10px,#170f24_10px_20px)] font-mono text-[10px] tracking-[0.1em] text-fg-faint [clip-path:polygon(0_0,100%_0,100%_calc(100%-36px),calc(100%-36px)_100%,0_100%)]"
        >
          {game.cover ? <Image draggable={false} src={game.cover} alt="" fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover" /> : "KEY ART"}
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
      </div>
    </Link>
  );
}

// Bigger dots than the default, so the cover reads through the mask.
const DOT_RADIUS = 2.8;

/** Home "Next in queue" card. */
export function NextInQueueCard({ game, lang, label, tba }: { game: Game; lang: Locale; label: string; tba: string }) {
  return (
    <aside className="relative flex min-h-105 flex-col justify-between gap-10 overflow-hidden bg-acc2 p-10 text-bg [clip-path:polygon(40px_0,100%_0,100%_calc(100%-40px),calc(100%-40px)_100%,0_100%,0_40px)]">
      {game.cover ? (
        <DotHexImage src={game.cover} radius={DOT_RADIUS} sizes="(min-width: 1024px) 280px, 46vw" className="absolute -top-7.5 -right-7.5 w-[46%]" />
      ) : (
        <DotHex fill="var(--bg)" radius={DOT_RADIUS} className="absolute -top-7.5 -right-7.5 h-auto w-[46%] opacity-35" />
      )}
      <div className="@container relative">
        {/*
          Keeps the text clear of the dot hexagon: a float over the part of the hexagon inside
          this box (46% of the card wide, shifted 30px out, p-10 padding), plus a small gap.
        */}
        <div aria-hidden className="float-right h-[calc(53.12cqw-19.5px)] w-[calc(46cqw-17px)]" />
        <div className="font-mono text-xs font-bold tracking-[0.18em]">{label}</div>
        <div className="mt-5 font-display text-[clamp(34px,4vw,48px)] leading-[0.95] font-bold uppercase">{game.title}</div>
        <TranslatedText text={game.description} lang={lang} className="mt-5 max-w-105 text-[17px] leading-normal font-medium" />
      </div>
      <div className="relative flex flex-wrap gap-2 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
        {PLATFORMS[game.platform] && (
          <span className="flex items-center bg-bg px-2.5 py-1.5 text-acc2">
            <PlatformLogo platform={game.platform} />
          </span>
        )}
        <span className="bg-bg px-2.5 py-1.5 text-acc2">{releaseYear(game) ?? tba}</span>
      </div>
    </aside>
  );
}
