import Link from "next/link";
import { connection } from "next/server";
import { cache, type CSSProperties, type ReactNode } from "react";
import { LIBRARY_SORTS, PLATFORMS, releaseYear, STATUS_COLORS, STATUSES, tierOf, type Game, type GameStatus, type LibraryQuery, type LibrarySort } from "@/content/games";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getLibraryPage } from "@/lib/games";
import { LibrarySearch, LibrarySearchFallback } from "./library-search";
import { gameHref } from "./nav";

type Strings = Dictionary["library"];
type View = "grid" | "list";
type LibraryState = LibraryQuery & { view: View };
export type LibrarySearchParams = Promise<Record<string, string | string[] | undefined>>;

export const DEFAULT_STATE: LibraryState = { q: "", status: null, sort: "recent", page: 1, view: "grid" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Reads the URL leniently: unknown values fall back to the defaults. */
function parseState(params: Awaited<LibrarySearchParams>): LibraryState {
  const status = first(params.status);
  const sort = first(params.sort);
  const page = Number(first(params.page));
  return {
    q: first(params.q)?.trim() ?? "",
    status: STATUSES.find((value) => value === status) ?? null,
    sort: LIBRARY_SORTS.find((value) => value === sort) ?? DEFAULT_STATE.sort,
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    view: first(params.view) === "list" ? "list" : "grid",
  };
}

/** Library URL for `state` with `patch` applied; defaults are left out of the query string. */
function libraryHref(lang: Locale, state: LibraryState, patch: Partial<LibraryState>) {
  const next = { ...state, ...patch };
  const query = new URLSearchParams();
  if (next.q) query.set("q", next.q);
  if (next.status) query.set("status", next.status);
  if (next.sort !== DEFAULT_STATE.sort) query.set("sort", next.sort);
  if (next.view !== DEFAULT_STATE.view) query.set("view", next.view);
  if (next.page > 1) query.set("page", String(next.page));
  const path = localizePath("/library", lang);
  return query.size ? `${path}?${query}` : path;
}

// Counter and results share one query per request.
const loadPage = cache((q: string, status: GameStatus | null, sort: LibrarySort, page: number) => getLibraryPage({ q, status, sort, page }));

async function load(searchParams: LibrarySearchParams) {
  const state = parseState(await searchParams);
  // MongoDB's driver reads the clock; defer its work until a request arrives.
  await connection();
  const result = await loadPage(state.q, state.status, state.sort, state.page);
  return { state, result };
}

/** Purple hexagon with the match count; dashes until the data arrives. */
export async function LibraryCounter({ searchParams, t }: { searchParams: LibrarySearchParams; t: Strings }) {
  const { result } = await load(searchParams);
  return <CounterFace matches={result.matches} total={result.total} t={t} />;
}

export function CounterFace({ matches, total, t }: { matches?: number; total?: number; t: Strings }) {
  return (
    <div className="hex absolute inset-0 flex flex-col items-center justify-center gap-1 bg-acc2 font-mono font-bold text-bg">
      <span className="text-[72px] leading-[0.9]">{matches ?? "—"}</span>
      <span className="text-xs tracking-[0.18em]">
        {t.of} {total ?? "—"} {t.entries}
      </span>
    </div>
  );
}

const statusChip = "grid min-h-13 place-items-center px-5 font-display text-sm font-bold tracking-[0.12em] uppercase [clip-path:polygon(10px_0,100%_0,calc(100%-10px)_100%,0_100%)]";

/** Search, status filter, sort and view switches. All state lives in the URL. */
export async function LibraryControls({ searchParams, lang, t }: { searchParams: LibrarySearchParams; lang: Locale; t: Strings }) {
  const state = parseState(await searchParams);
  return <ControlsFace state={state} lang={lang} t={t} search={<LibrarySearch placeholder={t.search} label={t.searchLabel} />} />;
}

export function ControlsFace({ state, lang, t, search }: { state: LibraryState; lang: Locale; t: Strings; search?: ReactNode }) {
  const statuses: { value: GameStatus | null; label: string; color: string }[] = [
    { value: null, label: t.all, color: "var(--fg)" },
    ...STATUSES.map((status) => ({ value: status, label: t.statuses[status], color: STATUS_COLORS[status] })),
  ];

  return (
    <div className="flex flex-col gap-4 scroll-mt-24">
      <div className="flex flex-wrap items-stretch gap-1.5">
        {search ?? <LibrarySearchFallback placeholder={t.search} label={t.searchLabel} />}
        <nav aria-label={t.columns.status} className="flex flex-wrap gap-1.5">
          {statuses.map(({ value, label, color }) => {
            const active = state.status === value;
            return (
              <Link
                key={label}
                href={libraryHref(lang, state, { status: value, page: 1 })}
                scroll={false}
                aria-current={active ? "page" : undefined}
                style={{ "--c": color } as CSSProperties}
                className={`${statusChip} ${active ? "bg-(--c) text-bg hover:text-bg" : "bg-surface text-(--c) hover:bg-surface-hover hover:text-(--c)"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex flex-wrap items-center gap-4.5">
          <span className="font-mono text-[11px] tracking-[0.16em] text-fg-faint">{t.sortBy}</span>
          {LIBRARY_SORTS.map((sort) => {
            const active = state.sort === sort;
            return (
              <Link
                key={sort}
                href={libraryHref(lang, state, { sort, page: 1 })}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={`border-b-3 py-1.5 font-display text-[15px] font-bold tracking-widest uppercase ${active ? "border-acc text-acc" : "border-transparent text-fg-dim hover:text-fg"}`}
              >
                {t.sorts[sort]}
              </Link>
            );
          })}
        </div>
        <div className="flex gap-1">
          {(["grid", "list"] as const).map((view) => {
            const active = state.view === view;
            return (
              <Link
                key={view}
                href={libraryHref(lang, state, { view })}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={`px-4.5 py-2.5 font-mono text-[11px] font-bold tracking-[0.14em] ${active ? "bg-acc text-bg hover:text-bg" : "bg-surface text-fg-dim hover:text-fg"}`}
              >
                {t[view]}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Current page of games, as a grid or a list, with pagination. */
export async function LibraryResults({ searchParams, lang, t }: { searchParams: LibrarySearchParams; lang: Locale; t: Strings }) {
  const { state, result } = await load(searchParams);
  const score = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  if (!result.games.length) {
    return (
      <div className="flex flex-col items-center gap-5 px-6 py-18 text-center bg-surface">
        <div aria-hidden className="hex h-15.5 w-18 bg-acc2" />
        <p className="font-display text-[28px] font-bold uppercase">{t.noMatches}</p>
      </div>
    );
  }

  return (
    <>
      {state.view === "grid" ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-x-6 gap-y-9">
          {result.games.map((game) => (
            <li key={game.id}>
              <GridCard game={game} lang={lang} score={score} t={t} />
            </li>
          ))}
        </ul>
      ) : (
        <ListTable games={result.games} lang={lang} offset={result.offset} score={score} t={t} />
      )}
      {result.pages > 1 && <Pagination state={{ ...state, page: result.page }} pages={result.pages} lang={lang} t={t} />}
    </>
  );
}

function ScoreHex({ game, score, className }: { game: Game; score: Intl.NumberFormat; className: string }) {
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

function StatusTag({ status, t, className = "" }: { status: GameStatus; t: Strings; className?: string }) {
  return (
    <span style={{ "--c": STATUS_COLORS[status] } as CSSProperties} className={`bg-(--c) px-2.5 py-1.25 font-mono text-[10px] font-bold tracking-[0.14em] text-bg uppercase ${className}`}>
      {t.statuses[status]}
    </span>
  );
}

function GridCard({ game, lang, score, t }: { game: Game; lang: Locale; score: Intl.NumberFormat; t: Strings }) {
  const meta = [PLATFORMS[game.platform]?.name, game.genre, releaseYear(game)].filter(Boolean).join(" · ");
  return (
    <Link href={gameHref(lang, game.id)} className="flex flex-col gap-4 text-fg hover:text-fg motion-safe:transition-transform hover:-translate-y-1">
      <div className="relative">
        <div
          aria-hidden
          className="relative grid aspect-[3/4] place-items-center bg-[repeating-linear-gradient(135deg,#2a1b40_0_10px,#170f24_10px_20px)] p-3 text-center font-mono text-[10px] tracking-[0.1em] text-fg-faint [clip-path:polygon(0_0,100%_0,100%_calc(100%-32px),calc(100%-32px)_100%,0_100%)]"
        >
          COVER ART
          <div style={{ background: STATUS_COLORS[game.status] }} className="absolute bottom-0 left-0 w-full h-2" />
        </div>
        <ScoreHex game={game} score={score} className="absolute -top-3 -right-2.5 h-13.5 w-15.5 text-[17px]" />
        <StatusTag status={game.status} t={t} className="absolute left-0 top-3.5" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-xl leading-[1.05] font-bold uppercase">{game.title}</h2>
        <div className="font-mono text-[11px] tracking-widest text-fg-dim uppercase">{meta}</div>
      </div>
    </Link>
  );
}

const listColumns = "grid grid-cols-[56px_minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1fr)_72px_130px_64px] gap-4";

function ListTable({ games, lang, offset, score, t }: { games: Game[]; lang: Locale; offset: number; score: Intl.NumberFormat; t: Strings }) {
  const c = t.columns;
  const number = (index: number) => String(offset + index + 1).padStart(3, "0");
  return (
    <>
      {/* Mobile: one compact card per game instead of the wide table. */}
      <ul className="flex flex-col gap-2 desk:hidden">
        {games.map((game, index) => (
          <li key={game.id}>
            <Link
              href={gameHref(lang, game.id)}
              style={{ borderLeftColor: STATUS_COLORS[game.status] }}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-l-5 bg-surface py-3.5 pr-3.5 pl-4 text-fg [clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,0_100%)] hover:text-fg active:bg-surface-hover"
            >
              <div className="flex flex-col min-w-0 gap-1.5">
                <div className="flex items-baseline gap-2 font-display font-bold">
                  <span className="text-base text-transparent [-webkit-text-stroke:1px_var(--acc2)]">{number(index)}</span>
                  <span className="text-[17px] leading-[1.1] uppercase">{game.title}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] font-bold tracking-widest uppercase">
                  <StatusTag status={game.status} t={t} className="px-2! py-1!" />
                  {PLATFORMS[game.platform] && <span className="px-2 py-1 bg-bg text-fg-dim">{PLATFORMS[game.platform].name}</span>}
                  <span className="px-2 py-1 bg-bg text-fg-dim">{game.hours}h</span>
                </div>
                <div className="text-xs text-fg-dim">{game.genre}</div>
              </div>
              <ScoreHex game={game} score={score} className="h-11.25 w-13 text-[15px]" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto desk:block">
        <div role="table" className="flex min-w-190 flex-col gap-1.5">
          <div role="row" className={`${listColumns} px-4.5 pb-2 font-mono text-[10px] font-bold tracking-[0.16em] text-fg-faint`}>
            <span role="columnheader">#</span>
            <span role="columnheader">{c.title}</span>
            <span role="columnheader">{c.platform}</span>
            <span role="columnheader">{c.genre}</span>
            <span role="columnheader">{c.hours}</span>
            <span role="columnheader">{c.status}</span>
            <span role="columnheader" className="text-right">
              {c.score}
            </span>
          </div>
          {games.map((game, index) => (
            <div
              key={game.id}
              role="row"
              style={{ borderLeftColor: STATUS_COLORS[game.status] }}
              className={`${listColumns} relative items-center border-l-6 bg-surface px-4.5 py-3 hover:bg-surface-hover`}
            >
              <span role="cell" className="font-display text-[26px] font-bold text-transparent [-webkit-text-stroke:1px_var(--acc2)]">
                {number(index)}
              </span>
              <div role="cell" className="min-w-0">
                <Link href={gameHref(lang, game.id)} className="font-display text-[19px] font-bold text-fg uppercase after:absolute after:inset-0 hover:text-fg">
                  {game.title}
                </Link>
                <div className="text-[13px] text-fg-dim">{game.dev}</div>
              </div>
              <span role="cell" className="font-mono text-xs text-fg-muted">
                {PLATFORMS[game.platform]?.name}
              </span>
              <span role="cell" className="font-mono text-xs text-fg-muted">
                {game.genre}
              </span>
              <span role="cell" className="font-mono text-sm font-bold">
                {game.hours}h
              </span>
              <span role="cell" className="justify-self-start">
                <StatusTag status={game.status} t={t} />
              </span>
              <span role="cell" className="justify-self-end">
                <ScoreHex game={game} score={score} className="w-14 h-12 text-base" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const pageArrow = "bg-acc2 py-3.5 font-display text-sm font-bold tracking-[0.12em] text-bg uppercase";

function Pagination({ state, pages, lang, t }: { state: LibraryState; pages: number; lang: Locale; t: Strings }) {
  const arrow = (target: number, label: string, shape: string) =>
    target >= 1 && target <= pages ? (
      <Link href={libraryHref(lang, state, { page: target })} scroll={false} className={`${pageArrow} ${shape} hover:bg-fg hover:text-bg`}>
        {label}
      </Link>
    ) : (
      <span aria-disabled className={`${pageArrow} ${shape} opacity-30`}>
        {label}
      </span>
    );

  return (
    <nav aria-label={t.page} className="flex flex-wrap items-center justify-center gap-2.5 pt-4">
      {arrow(state.page - 1, t.prev, "pr-5.5 pl-7.5 [clip-path:polygon(14px_0,100%_0,100%_100%,14px_100%,0_50%)]")}
      {Array.from({ length: pages }, (_, index) => index + 1).map((page) => (
        <Link
          key={page}
          href={libraryHref(lang, state, { page })}
          scroll={false}
          aria-current={page === state.page ? "page" : undefined}
          className={`hex grid h-12 w-14 place-items-center font-mono text-base font-bold ${page === state.page ? "bg-acc text-bg hover:text-bg" : "bg-surface text-fg hover:bg-surface-hover hover:text-fg"}`}
        >
          {page}
        </Link>
      ))}
      {arrow(state.page + 1, t.next, "pr-7.5 pl-5.5 [clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)]")}
      <span className="w-full text-center font-mono text-[11px] tracking-[0.16em] text-fg-faint">
        {t.page} {state.page} / {pages}
      </span>
    </nav>
  );
}
