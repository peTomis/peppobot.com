"use client";

import type { ReactNode } from "react";
import { locales, type Locale } from "@/i18n/config";
import type { Translated } from "@/i18n/translations";

export const inputClass = "w-full min-w-0 border border-line bg-bg px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-acc";
export const labelClass = "font-mono text-[10px] font-bold tracking-[0.14em] text-fg-dim uppercase";
export const buttonClass = "border border-line bg-surface px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.12em] text-fg-muted uppercase hover:border-acc hover:text-fg disabled:opacity-40";

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export function Section({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold tracking-[0.08em] text-fg uppercase">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function TextInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <input className={inputClass} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
}

/** A number input where empty means null. */
export function NumberInput({ value, onChange, min, max, step = 1 }: { value: number | null; onChange: (value: number | null) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      className={inputClass}
      value={value ?? ""}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
    />
  );
}

export function Select<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <select
      className={inputClass}
      value={String(value)}
      onChange={(event) => onChange(options.find((option) => String(option.value) === event.target.value)!.value)}
    >
      {options.map((option) => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

const valueIn = (text: Translated, lang: Locale) => text.find((entry) => entry.key === lang)?.value ?? "";

/** Sets one language of a text, keeping the others in place. */
function withValue(text: Translated, lang: Locale, value: string): Translated {
  const others = text.filter((entry) => entry.key !== lang);
  return locales.flatMap((key) => (key === lang ? [{ key, value }] : others.filter((entry) => entry.key === key)));
}

/** One input per language, side by side. */
export function TranslatedInput({ value, onChange, multiline = false, placeholder }: { value: Translated; onChange: (value: Translated) => void; multiline?: boolean; placeholder?: string }) {
  return (
    <div className="grid grid-cols-1 gap-2 @lg:grid-cols-2">
      {locales.map((lang) => (
        <div key={lang} className="relative">
          <span className="pointer-events-none absolute top-2 right-2 font-mono text-[9px] font-bold tracking-widest text-fg-faint uppercase">{lang}</span>
          {multiline ? (
            <textarea
              className={`${inputClass} field-sizing-content min-h-20 resize-y pr-8 leading-relaxed`}
              value={valueIn(value, lang)}
              placeholder={placeholder}
              onChange={(event) => onChange(withValue(value, lang, event.target.value))}
            />
          ) : (
            <input className={`${inputClass} pr-8`} value={valueIn(value, lang)} placeholder={placeholder} onChange={(event) => onChange(withValue(value, lang, event.target.value))} />
          )}
        </div>
      ))}
    </div>
  );
}

/** A list of translated lines (pros, cons) with add and remove. */
export function TranslatedList({ items, onChange, addLabel }: { items: Translated[]; onChange: (items: Translated[]) => void; addLabel: string }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <TranslatedInput value={item} onChange={(value) => onChange(items.map((other, i) => (i === index ? value : other)))} />
          </div>
          <button type="button" className={buttonClass} aria-label="Remove" onClick={() => onChange(items.filter((_, i) => i !== index))}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className={`${buttonClass} self-start`} onClick={() => onChange([...items, []])}>
        + {addLabel}
      </button>
    </div>
  );
}
