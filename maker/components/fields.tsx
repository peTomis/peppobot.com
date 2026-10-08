"use client";

import { useId, useState, type ReactNode } from "react";
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

/** A select you can type in: the text filters the options, arrows and Enter pick one, Escape gives up. */
export function Combobox({ value, options, onChange, placeholder }: { value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; placeholder?: string }) {
  const listId = useId();
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const open = query != null;
  const selected = options.find((option) => option.value === value);
  const search = query?.trim().toLowerCase() ?? "";
  const matches = search ? options.filter((option) => option.label.toLowerCase().includes(search)) : options;

  const pick = (option: { value: string } | undefined) => {
    setQuery(null);
    if (option && option.value !== value) onChange(option.value);
  };

  return (
    <div className="relative w-full min-w-0">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
        className={inputClass}
        value={query ?? selected?.label ?? ""}
        placeholder={placeholder}
        onFocus={(event) => {
          setQuery("");
          setActive(0);
          event.target.select();
        }}
        onBlur={() => setQuery(null)}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) return setQuery("");
            const step = event.key === "ArrowDown" ? 1 : -1;
            setActive((index) => (matches.length ? (index + step + matches.length) % matches.length : 0));
          } else if (event.key === "Enter" && open) {
            event.preventDefault();
            pick(matches[active]);
            event.currentTarget.blur();
          } else if (event.key === "Escape" && open) {
            setQuery(null);
            event.currentTarget.blur();
          }
        }}
      />
      {open && (
        <ul id={listId} role="listbox" className="absolute top-full right-0 left-0 z-20 mt-1 max-h-72 overflow-y-auto border border-line bg-surface shadow-lg">
          {matches.length ? (
            matches.map((option, index) => (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option.value === value}
                // mousedown, not click: picking must happen before the input's blur closes the list.
                onMouseDown={(event) => {
                  event.preventDefault();
                  pick(option);
                  (document.activeElement as HTMLElement | null)?.blur();
                }}
                onMouseEnter={() => setActive(index)}
                className={`cursor-pointer px-3 py-2 text-sm ${index === active ? "bg-bg text-fg" : "text-fg-muted"} ${option.value === value ? "text-acc!" : ""}`}
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-fg-faint">No match</li>
          )}
        </ul>
      )}
    </div>
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
