"use client";

import { useActionState, useId, useRef, useState, type KeyboardEvent } from "react";
import type { CSSProperties } from "react";
import { deleteReviewAction, saveReviewAction, type ReviewState } from "@/app/actions/reviews";
import { tierOf } from "@/content/games";
import { averageOf, REVIEW_LIMITS, sanitizeReviewText, SCORE_STEP, visibleLength } from "@/content/reviews";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { BoldText } from "./bold-text";
import { Radar } from "./radar";

type Strings = Dictionary["reviewForm"];

type Paragraph = { key: number; text: string };

const initial: ReviewState = { error: null };

/** The crew review form: six sliders drawing the visitor's hexagon live, and paragraphs with bold as their only formatting. */
export function ReviewForm({
  game,
  lang,
  axes,
  initialScores,
  initialParagraphs,
  editing,
  cancelHref,
  t,
}: {
  /** Slug or id of the game. */
  game: string;
  lang: Locale;
  axes: { name: string; note: string }[];
  initialScores: number[];
  initialParagraphs: string[];
  editing: boolean;
  cancelHref: string;
  t: Strings;
}) {
  const [state, save, saving] = useActionState(saveReviewAction, initial);
  const [deleteState, remove, deleting] = useActionState(deleteReviewAction, initial);
  const [scores, setScores] = useState(initialScores);
  const nextKey = useRef(initialParagraphs.length);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>(() => initialParagraphs.map((text, key) => ({ key, text })));
  const one = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const average = averageOf(scores);
  const tier = tierOf(average);
  const error = state.error ?? deleteState.error;

  const update = (key: number, text: string) => setParagraphs((list) => list.map((paragraph) => (paragraph.key === key ? { ...paragraph, text } : paragraph)));

  return (
    <div className="flex flex-col gap-10">
      <form action={save} className="flex flex-col gap-12">
        <input type="hidden" name="game" value={game} />
        <input type="hidden" name="lang" value={lang} />

        <fieldset className="grid grid-cols-1 items-center gap-12 desk:grid-cols-2">
          <legend className="mb-6 font-display text-[22px] font-bold tracking-[0.06em] uppercase">{t.hexagon}</legend>
          <div className="relative flex flex-col items-center gap-6">
            <span
              style={{ "--c": tier.color } as CSSProperties}
              className="hex flex h-20 w-23 flex-col items-center justify-center bg-(--c) font-mono font-bold text-bg"
            >
              <span className="text-[28px] leading-none">{one.format(average)}</span>
              <span className="text-[9px] tracking-[0.16em]">{t.average}</span>
            </span>
            <div className="w-full py-8">
              <Radar values={scores} labels={axes.map((axis) => axis.name)} format={one} />
            </div>
          </div>
          <ul className="flex flex-col gap-5">
            {axes.map((axis, index) => (
              <li key={index} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label id={`score-label-${index}`} htmlFor={`score-${index}`} className="font-display text-lg font-bold tracking-[0.08em] uppercase">
                    {axis.name}
                  </label>
                  <ScoreInput
                    value={scores[index]}
                    format={one}
                    labelledBy={`score-label-${index}`}
                    onChange={(value) => setScores((list) => list.map((score, at) => (at === index ? value : score)))}
                  />
                </div>
                <ScoreSlider
                  id={`score-${index}`}
                  name={`score${index}`}
                  value={scores[index]}
                  describedBy={`axis-note-${index}`}
                  onChange={(value) => setScores((list) => list.map((score, at) => (at === index ? value : score)))}
                />
                <p id={`axis-note-${index}`} className="text-[13px] leading-normal text-fg-dim">
                  <BoldText text={axis.note} />
                </p>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset className="flex flex-col gap-6">
          <legend className="mb-2 font-display text-[22px] font-bold tracking-[0.06em] uppercase">{t.paragraphs}</legend>
          {paragraphs.map((paragraph, index) => (
            <ParagraphEditor
              key={paragraph.key}
              index={index}
              text={paragraph.text}
              onChange={(text) => update(paragraph.key, text)}
              onRemove={() => setParagraphs((list) => list.filter((other) => other.key !== paragraph.key))}
              t={t}
            />
          ))}
          {paragraphs.length < REVIEW_LIMITS.paragraphs && (
            <button
              type="button"
              onClick={() => setParagraphs((list) => [...list, { key: nextKey.current++, text: "" }])}
              className="self-start border-2 border-dashed border-line px-4 py-2.5 font-mono text-xs font-bold tracking-[0.12em] text-fg-muted uppercase hover:border-acc hover:text-acc"
            >
              {t.addParagraph}
            </button>
          )}
        </fieldset>

        {error && (
          <p role="alert" className="bg-acc3 px-4 py-3 font-mono text-sm font-bold text-bg">
            {t.errors[error].replace("{max}", String(error === "tooMany" ? REVIEW_LIMITS.paragraphs : REVIEW_LIMITS.paragraphLength))}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={saving || deleting}
            className="bg-acc px-6 py-3.5 font-display text-base font-bold tracking-[0.12em] text-bg uppercase [clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,0_100%)] hover:bg-fg disabled:opacity-60"
          >
            {saving ? t.saving : t.save}
          </button>
          <a href={cancelHref} className="font-mono text-xs font-bold tracking-[0.12em] text-fg-dim uppercase underline underline-offset-4 hover:text-fg">
            {t.cancel}
          </a>
        </div>
      </form>

      {editing && (
        <form
          action={remove}
          onSubmit={(event) => {
            if (!window.confirm(t.confirmDelete)) event.preventDefault();
          }}
          className="border-t border-line pt-6"
        >
          <input type="hidden" name="game" value={game} />
          <input type="hidden" name="lang" value={lang} />
          <button type="submit" disabled={saving || deleting} className="font-mono text-xs font-bold tracking-[0.12em] text-acc3 uppercase underline underline-offset-4 hover:no-underline disabled:opacity-60">
            {deleting ? t.deleting : t.delete}
          </button>
        </form>
      )}
    </div>
  );
}

/** A typed score: 0–10, rounded to the slider's step; accepts "7.5" and "7,5". Null when it cannot be read. */
function parseScore(text: string): number | null {
  const value = Number(text.trim().replace(",", "."));
  if (!text.trim() || !Number.isFinite(value)) return null;
  return Math.min(10, Math.max(0, Math.round(value / SCORE_STEP) * SCORE_STEP));
}

/** The score as a number to type, next to its slider. Valid input moves the slider as you type; leaving the field shows the stored value again. */
function ScoreInput({ value, format, labelledBy, onChange }: { value: number; format: Intl.NumberFormat; labelledBy: string; onChange: (value: number) => void }) {
  // While typing, the field shows what was typed ("7,", "") rather than the stored value.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-labelledby={labelledBy}
      value={draft ?? format.format(value)}
      onFocus={(event) => event.target.select()}
      onChange={(event) => {
        setDraft(event.target.value);
        const parsed = parseScore(event.target.value);
        if (parsed != null) onChange(parsed);
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          // Enter confirms the score instead of submitting the whole review.
          event.preventDefault();
          setDraft(null);
        } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();
          setDraft(null);
          onChange(Math.min(10, Math.max(0, value + (event.key === "ArrowUp" ? SCORE_STEP : -SCORE_STEP))));
        }
      }}
      maxLength={4}
      style={{ color: tierOf(value).color }}
      className="w-16 border border-line bg-bg px-2 py-1 text-right font-mono text-lg font-bold outline-none focus:border-acc"
    />
  );
}

/** A 0–10 score as a slider in the score matrix's bar style, coloured by the tier the score falls in (as the average's badge). */
function ScoreSlider({ id, name, value, describedBy, onChange }: { id: string; name: string; value: number; describedBy: string; onChange: (value: number) => void }) {
  return (
    <input
      type="range"
      id={id}
      name={name}
      aria-describedby={describedBy}
      min={0}
      max={10}
      step={SCORE_STEP}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      style={{ "--fill": `${value * 10}%`, "--fill-color": tierOf(value).color } as CSSProperties}
      className="h-5.5 w-full cursor-pointer appearance-none outline-offset-4 focus-visible:outline-2 focus-visible:outline-acc bg-[linear-gradient(90deg,var(--fill-color)_var(--fill),var(--surface)_var(--fill))] [&::-moz-range-thumb]:h-5.5 [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-fg [&::-webkit-slider-thumb]:h-5.5 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-fg"
    />
  );
}

/** One paragraph: a textarea with a bold button, a character count and a preview of what will be published. */
function ParagraphEditor({ index, text, onChange, onRemove, t }: { index: number; text: string; onChange: (text: string) => void; onRemove: () => void; t: Strings }) {
  const id = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  // The preview shows the text exactly as the server will keep it.
  const clean = sanitizeReviewText(text);
  const length = visibleLength(clean);
  const over = length > REVIEW_LIMITS.paragraphLength;

  /** Wraps the selection in `<b>…</b>`, or unwraps it when it is already bold. */
  const bold = () => {
    const field = area.current;
    if (!field) return;
    const { selectionStart: start, selectionEnd: end, value } = field;
    const selected = value.slice(start, end);
    const wrapped = value.slice(Math.max(0, start - 3), start) === "<b>" && value.slice(end, end + 4) === "</b>";
    const next = wrapped ? value.slice(0, start - 3) + selected + value.slice(end + 4) : `${value.slice(0, start)}<b>${selected}</b>${value.slice(end)}`;
    onChange(next);
    const offset = wrapped ? -3 : 3;
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + offset, end + offset);
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
      event.preventDefault();
      bold();
    }
  };

  return (
    <div className="flex flex-col gap-2 bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="font-mono text-xs font-bold tracking-[0.12em] text-fg-muted uppercase">
          {t.paragraph.replace("{n}", String(index + 1))}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={bold}
            title={t.boldLabel}
            aria-label={t.boldLabel}
            className="grid h-8 w-8 place-items-center bg-bg font-display text-sm font-bold text-fg hover:bg-acc hover:text-bg"
          >
            {t.bold}
          </button>
          <button type="button" onClick={onRemove} className="px-2 font-mono text-[11px] font-bold tracking-[0.12em] text-fg-dim uppercase hover:text-acc3">
            {t.remove}
          </button>
        </div>
      </div>
      <textarea
        ref={area}
        id={id}
        name="paragraph"
        value={text}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        rows={5}
        maxLength={REVIEW_LIMITS.paragraphLength * 2}
        aria-invalid={over || undefined}
        className="w-full resize-y border border-line bg-bg p-3 text-[15px] leading-[1.6] text-fg outline-none focus:border-acc"
      />
      <span className={`self-end font-mono text-[11px] font-bold ${over ? "text-acc3" : "text-fg-dim"}`}>
        {t.chars.replace("{count}", String(length)).replace("{max}", String(REVIEW_LIMITS.paragraphLength))}
      </span>
      {clean && (
        <div className="flex flex-col gap-1.5 border-l-4 border-acc2 pl-3">
          <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-fg-dim uppercase">{t.preview}</span>
          <p className="text-[15px] leading-[1.6] break-words whitespace-pre-line text-fg-soft">
            <BoldText text={clean} links={false} />
          </p>
        </div>
      )}
    </div>
  );
}
