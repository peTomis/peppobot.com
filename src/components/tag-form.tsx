"use client";

import { useActionState } from "react";
import { chooseTagAction, type TagState } from "@/app/actions/account";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Strings = Dictionary["account"];

/** Choose or change the crew tag shown on the visitor's reviews; the server checks that it is free. */
export function TagForm({ current, next, lang, t }: { current: string | null; next: string; lang: Locale; t: Strings }) {
  const [state, action, pending] = useActionState(chooseTagAction, { error: null, tag: current ?? "" } satisfies TagState);
  return (
    <form action={action} className="flex max-w-xl flex-col gap-3">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="next" value={next} />
      <label htmlFor="crew-tag" className="font-mono text-xs font-bold tracking-[0.12em] text-fg-muted uppercase">
        {t.tag}
      </label>
      <div className="flex flex-wrap gap-3">
        <input
          id="crew-tag"
          name="tag"
          defaultValue={state.tag}
          required
          minLength={3}
          maxLength={20}
          // Same rule as `TAG_PATTERN`; HTML patterns use the `v` flag, where a literal `-` needs escaping.
          pattern="[A-Za-z0-9][A-Za-z0-9_\-]{2,19}"
          autoComplete="nickname"
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby="crew-tag-hint"
          aria-invalid={state.error ? true : undefined}
          className="min-w-0 flex-1 border border-line bg-bg px-4 py-3 font-mono text-lg font-bold text-fg outline-none focus:border-acc"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-acc px-6 py-3 font-display text-base font-bold tracking-[0.12em] text-bg uppercase [clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,0_100%)] hover:bg-fg disabled:opacity-60"
        >
          {pending ? t.saving : t.save}
        </button>
      </div>
      <p id="crew-tag-hint" className="text-[13px] text-fg-dim">
        {t.tagHint}
      </p>
      {state.error && (
        <p role="alert" className="bg-acc3 px-4 py-3 font-mono text-sm font-bold text-bg">
          {t.errors[state.error]}
        </p>
      )}
    </form>
  );
}
