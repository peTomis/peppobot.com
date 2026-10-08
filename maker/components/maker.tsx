"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { GENRES, PLATFORMS, STATUSES, type GameStatus } from "@/content/games";
import en from "@/i18n/dictionaries/en.json";
import type { Locale } from "@/i18n/config";
import { saveGame } from "../app/actions";
import { averageOf, fromDateInput, previewGame, toDateInput, type Draft } from "../lib/draft";
import type { GameEntry } from "../lib/games";
import type { PreviewMessage } from "../lib/preview";
import { BlocksEditor } from "./blocks-editor";
import { buttonClass, Field, inputClass, labelClass, NumberInput, Section, Select, TextInput, TranslatedInput, TranslatedList } from "./fields";
import { PreviewFrame, type Viewport } from "./preview-frame";

const PLATFORM_OPTIONS = Object.values(PLATFORMS).map((platform) => ({ value: platform.id, label: platform.name }));
const GENRE_OPTIONS = Object.values(GENRES).map((genre) => ({ value: genre.id, label: genre.name }));
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

  const message = useMemo<PreviewMessage>(() => ({ type: "maker:game", game: previewGame(draft, id ?? "new"), number, lang }), [draft, id, number, lang]);

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

  return (
    <div className="grid h-dvh grid-cols-[minmax(420px,1fr)_minmax(0,1.2fr)] overflow-hidden">
      <div className="flex flex-col min-h-0 border-r border-line">
        <header className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-line bg-surface">
          <span className="font-display text-base font-bold tracking-[0.14em] text-acc uppercase">Maker</span>
          <select className={`${inputClass} w-auto flex-1`} value={id ?? ""} onChange={(event) => open(event.target.value)} aria-label="Game">
            <option value="">— New game —</option>
            {games.map((game) => (
              <option key={game._id} value={game._id}>
                {game.title || "(untitled)"} · {game.status}
              </option>
            ))}
          </select>
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
          <span className={`${labelClass} flex-1`}>Preview</span>
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
        <PreviewFrame message={message} viewport={viewport} />
      </div>
    </div>
  );
}
