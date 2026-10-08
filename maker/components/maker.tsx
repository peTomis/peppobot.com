"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { GENRES_BY_NAME, PLATFORMS, STATUSES, type GameStatus } from "@/content/games";
import en from "@/i18n/dictionaries/en.json";
import type { Locale } from "@/i18n/config";
import { saveGame } from "../app/actions";
import { averageOf, fromDateInput, previewGame, toDateInput, type Draft } from "../lib/draft";
import type { GameEntry } from "../lib/games";
import type { PreviewMessage, PreviewView } from "../lib/preview";
import { BlocksEditor } from "./blocks-editor";
import { buttonClass, Combobox, Field, inputClass, labelClass, NumberInput, Section, Select, TextInput, TranslatedInput, TranslatedList } from "./fields";
import { PreviewFrame, type Viewport } from "./preview-frame";

const PLATFORM_OPTIONS = Object.values(PLATFORMS).map((platform) => ({ value: platform.id, label: platform.name }));
const GENRE_OPTIONS = GENRES_BY_NAME.map((genre) => ({ value: genre.id, label: genre.name }));
const STATUS_OPTIONS = STATUSES.map((status) => ({ value: status, label: status }));
const AXES = en.report.axes.map((axis) => axis.name);

const ended = (status: GameStatus) => status === "Completed" || status === "Dropped";

/** Editor on the left, live preview of the site's report page on the right. */
export function Maker({ id, initial, number, games }: { id: string | null; initial: Draft; number: number; games: GameEntry[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [lang, setLang] = useState<Locale>("en");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [view, setView] = useState<PreviewView>("details");
  // A local image to try in the cards before uploading it; it never reaches the draft.
  const [localImage, setLocalImage] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const dirty = draft !== saved;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Free the previous local image when it is replaced or the editor closes.
  useEffect(() => {
    if (!localImage) return;
    return () => URL.revokeObjectURL(localImage.url);
  }, [localImage]);

  const message = useMemo<PreviewMessage>(() => {
    const draftGame = previewGame(draft, id ?? "new");
    const game = view === "images" && localImage ? { ...draftGame, cover: localImage.url } : draftGame;
    // Links are disabled in the preview, so the database id stands in for the main game's URL id.
    const main = game.mainGame ? games.find((entry) => entry._id === game.mainGame) : null;
    return { type: "maker:game", view, game, number, mainGame: main ? { id: main._id, title: main.title } : null, lang };
  }, [draft, id, number, lang, games, view, localImage]);

  const open = (target: string) => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    router.push(target ? `/?id=${target}` : "/?new");
  };

  const save = () =>
    startSaving(async () => {
      setError(null);
      const result = await saveGame(id, draft);
      if (!result.ok) return setError(result.error);
      setError(result.warning ?? null);
      setSaved(draft);
      if (result.id !== id) router.replace(`/?id=${result.id}`);
      else router.refresh();
    });

  const average = averageOf(draft.scores);
  const gameOptions = games.map((game) => ({ value: game._id, label: `${game.title || "(untitled)"} · ${game.status}${game.dlc ? " · DLC" : ""}` }));
  // A DLC belongs to a main game, never to itself or to another DLC.
  const mainGameOptions = games.filter((game) => game._id !== id && (!game.dlc || game._id === draft.mainGame)).map((game) => ({ value: game._id, label: game.title || "(untitled)" }));

  return (
    <div className="grid h-dvh grid-cols-[minmax(420px,1fr)_minmax(0,1.2fr)] overflow-hidden">
      <div className="flex flex-col min-h-0 border-r border-line">
        <header className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-line bg-surface">
          <span className="font-display text-base font-bold tracking-[0.14em] text-acc uppercase">Maker</span>
          <div className="flex-1 min-w-0">
            <Combobox value={id ?? ""} options={gameOptions} placeholder="Search games…" onChange={open} />
          </div>
          <button type="button" className={buttonClass} onClick={() => open("")}>
            New
          </button>
          <button type="button" disabled={saving || !dirty} onClick={save} className="bg-acc px-4 py-2 font-display text-sm font-bold tracking-[0.12em] text-bg uppercase disabled:opacity-40">
            {saving ? "Saving…" : id ? "Save" : "Create"}
          </button>
          <span className={`${labelClass} w-full ${error ? "text-acc3!" : ""}`}>{error ?? (dirty ? "Unsaved changes" : id ? "All changes saved" : "New game, not saved yet")}</span>
        </header>

        <div className="@container flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-5 pb-24">
          <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
            <Field label="Title" className="@lg:col-span-2">
              <TextInput value={draft.title} onChange={(value) => set("title", value)} />
            </Field>
            <Field label="Developer">
              <TextInput value={draft.dev} onChange={(value) => set("dev", value)} />
            </Field>
            <Field label="URL id (empty: database id)">
              <TextInput value={draft.id} placeholder="e.g. metroid-prime-4" onChange={(value) => set("id", value)} />
            </Field>
            <Field label="Platform">
              <Select value={draft.platform} options={PLATFORM_OPTIONS} onChange={(value) => set("platform", value)} />
            </Field>
            <Field label="Genre">
              <Select value={draft.genre} options={GENRE_OPTIONS} onChange={(value) => set("genre", value)} />
            </Field>
            <label className="flex items-center gap-2 self-end py-2">
              <input type="checkbox" className="accent-acc" checked={draft.dlc} onChange={(event) => set("dlc", event.target.checked)} />
              <span className={labelClass}>DLC</span>
            </label>
            {draft.dlc && (
              <Field label="Main game">
                <Combobox value={draft.mainGame} options={mainGameOptions} placeholder="Type to search…" onChange={(value) => set("mainGame", value)} />
              </Field>
            )}
            <div className="flex flex-col gap-1.5 @lg:col-span-2">
              <span className={labelClass}>Also played on</span>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORM_OPTIONS.filter((option) => option.value !== draft.platform).map((option) => {
                  const on = draft.alsoPlayedOn.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set("alsoPlayedOn", on ? draft.alsoPlayedOn.filter((platform) => platform !== option.value) : [...draft.alsoPlayedOn, option.value])}
                      className={`${buttonClass} ${on ? "border-acc! bg-acc! text-bg!" : ""}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Status">
              <Select value={draft.status} options={STATUS_OPTIONS} onChange={(value) => set("status", value)} />
            </Field>
            <Field label="Hours">
              <NumberInput value={draft.hours} min={0} onChange={(value) => set("hours", value ?? 0)} />
            </Field>
            <Field label="Progress %">
              <NumberInput value={draft.progress} min={0} max={100} onChange={(value) => set("progress", value)} />
            </Field>
            <Field label="Release date (empty: TBA)">
              <input type="date" className={inputClass} value={toDateInput(draft.releasedOn)} onChange={(event) => set("releasedOn", fromDateInput(event.target.value))} />
            </Field>
            <Field label={`Finished on${ended(draft.status) ? "" : " (completed / dropped only)"}`}>
              <input type="date" className={inputClass} value={toDateInput(draft.finishedOn)} onChange={(event) => set("finishedOn", fromDateInput(event.target.value))} />
            </Field>
            <Field label="Cover URL">
              <TextInput value={draft.cover} placeholder="https://…" onChange={(value) => set("cover", value)} />
            </Field>
          </div>

          <Field label="Description (headline)">
            <TranslatedInput multiline value={draft.description} onChange={(value) => set("description", value)} />
          </Field>
          <Field label="Signature (what only this game does)">
            <TranslatedInput value={draft.signature} onChange={(value) => set("signature", value)} />
          </Field>

          <Section title="Scores" actions={<span className={labelClass}>Average {average != null ? average.toFixed(1) : "—"}</span>}>
            {!ended(draft.status) && <p className="text-xs text-fg-dim">Scores, pros and cons show on the site only for completed or dropped runs.</p>}
            <div className="grid grid-cols-2 gap-3 @lg:grid-cols-3">
              {AXES.map((axis, index) => (
                <Field key={axis} label={axis}>
                  <NumberInput
                    value={draft.scores[index]}
                    min={0}
                    max={10}
                    step={0.5}
                    onChange={(value) => set("scores", draft.scores.map((score, i) => (i === index ? value : score)))}
                  />
                </Field>
              ))}
            </div>
          </Section>

          <Section title="Pros">
            <TranslatedList items={draft.pros} onChange={(value) => set("pros", value)} addLabel="Pro" />
          </Section>
          <Section title="Cons">
            <TranslatedList items={draft.cons} onChange={(value) => set("cons", value)} addLabel="Con" />
          </Section>

          <Section title="Report blocks">
            <BlocksEditor blocks={draft.blocks} onChange={(value) => set("blocks", value)} />
          </Section>
        </div>
      </div>

      <div className="flex flex-col min-h-0 bg-bg">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-line bg-surface">
          {(["details", "images"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setView(value)} className={`${buttonClass} ${view === value ? "border-acc! text-fg!" : ""}`}>
              {value}
            </button>
          ))}
          <span className="flex-1" />
          {(["en", "it"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setLang(value)} className={`${buttonClass} ${lang === value ? "border-acc! text-fg!" : ""}`}>
              {value}
            </button>
          ))}
          {(["desktop", "mobile"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setViewport(value)} className={`${buttonClass} ${viewport === value ? "border-acc! text-fg!" : ""}`}>
              {value}
            </button>
          ))}
        </div>
        {view === "images" && (
          <div className="flex items-center gap-2 px-5 py-2 border-b border-line bg-surface">
            <label className={`${buttonClass} cursor-pointer`}>
              Load image…
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setLocalImage({ url: URL.createObjectURL(file), name: file.name });
                  event.target.value = "";
                }}
              />
            </label>
            <span className={`${labelClass} min-w-0 flex-1 truncate`}>{localImage ? `Local: ${localImage.name} (not uploaded)` : draft.cover ? "Showing the cover URL" : "No cover: load an image to try it"}</span>
            {localImage && (
              <button type="button" className={buttonClass} onClick={() => setLocalImage(null)}>
                Clear
              </button>
            )}
          </div>
        )}
        <PreviewFrame message={message} viewport={viewport} />
      </div>
    </div>
  );
}
