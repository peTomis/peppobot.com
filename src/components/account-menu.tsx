"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { signOutAction } from "@/app/actions/account";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Strings = Dictionary["accountMenu"];

/** The signed-in visitor as the top bar knows it; `tag` is null until they choose one. */
export type Me = { tag: string | null };

/**
 * Session and panel state for the top bar. The session is read from /api/me after hydration (and
 * again on every navigation, so a tag chosen on the account page shows up), so pages stay static.
 */
export function useAccountMenu(pathname: string | null) {
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/me", { signal: abort.signal, cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<Me>) : null))
      .then((data) => setMe(data ? { tag: typeof data.tag === "string" ? data.tag : null } : null))
      // Offline or aborted: stay as we were.
      .catch(() => {});
    return () => abort.abort();
  }, [pathname]);

  return { me, setMe, open, setOpen };
}

const initialOf = (tag: string) => tag.charAt(0).toUpperCase();

/** What the account buttons show: the tag's initial when signed in, a pilot icon otherwise. */
export function AccountFace({ me, className = "" }: { me: Me | null; className?: string }) {
  if (me?.tag) return <span className={`font-display font-bold ${className}`}>{initialOf(me.tag)}</span>;
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`size-5 ${className}`} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="square">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

/** Label of an account button, for screen readers. */
export const accountLabel = (me: Me | null, t: Strings) => (me?.tag ? t.openSignedIn.replace("{tag}", me.tag) : t.open);

/**
 * Crew panel sliding in from the right: Google sign-in, or the visitor's tag, a link to their
 * account and sign-out. Always mounted so it can slide in and out; inert while closed.
 */
export function AccountPanel({
  me,
  setMe,
  open,
  setOpen,
  pathname,
  lang,
  t,
}: {
  me: Me | null;
  setMe: Dispatch<SetStateAction<Me | null>>;
  open: boolean;
  setOpen: (open: boolean) => void;
  pathname: string | null;
  lang: Locale;
  t: Strings;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const here = pathname ?? localizePath("/", lang);
  const accountHref = localizePath("/account", lang);

  // Escape closes; focus moves to the close button on open and back to the button that opened it on close.
  useEffect(() => {
    if (!open) {
      opener.current?.focus();
      opener.current = null;
      return;
    }
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await signOutAction();
      setMe(null);
      setOpen(false);
    } finally {
      setSigningOut(false);
    }
  };

  const row = "flex min-h-14 items-center gap-3 border-b border-line text-fg hover:text-acc";

  return (
    <>
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/60 transition-[opacity,visibility] duration-300 ease-out motion-reduce:transition-none ${open ? "visible opacity-100" : "invisible opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        inert={!open}
        className={`fixed top-0 right-0 bottom-0 z-51 flex w-[min(360px,calc(100%-48px))] flex-col overflow-y-auto border-l-2 border-acc2 bg-bg text-pretty text-fg transition-[translate,visibility] duration-300 ease-out motion-reduce:transition-none ${open ? "visible translate-x-0" : "invisible translate-x-full"}`}
      >
        <div className="flex flex-none items-center justify-between gap-2 pt-3 pr-3 pl-6">
          <h2 id={titleId} className="font-mono text-xs font-bold tracking-[0.16em] text-acc uppercase">
            {t.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label={t.close}
            onClick={() => setOpen(false)}
            className="grid size-11 cursor-pointer place-items-center text-fg-dim hover:text-acc"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="size-5.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="square">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 px-6 pt-4 pb-6">
          {me ? (
            <div className="flex items-center gap-3.5">
              <span className="hex grid h-13 w-15 flex-none place-items-center bg-acc text-[22px] text-bg">
                <AccountFace me={me} />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                {me.tag ? (
                  <>
                    <span className="font-mono text-lg leading-tight font-bold break-all">{me.tag}</span>
                    <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-fg-dim">{t.member}</span>
                  </>
                ) : (
                  <span className="text-[15px] leading-normal text-fg-soft">{t.noTag}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-[17px] leading-normal text-fg-soft">{t.signInPrompt}</p>
              {/* A plain link: the sign-in route redirects to Google and back here. */}
              <a
                href={`/api/auth/google?next=${encodeURIComponent(here)}`}
                onClick={() => setSigningIn(true)}
                aria-busy={signingIn || undefined}
                className="flex min-h-12 items-center justify-center gap-2.5 bg-acc px-4 font-display text-sm font-bold tracking-[0.12em] text-bg uppercase [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,0_100%)] hover:bg-fg"
              >
                {signingIn ? (
                  <span aria-hidden className="hex size-4 animate-[spin_1.4s_linear_infinite] bg-bg" />
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden className="size-4.5" fill="currentColor">
                    <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3ZM12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Zm-5.6-8a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6ZM12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9Z" />
                  </svg>
                )}
                {signingIn ? t.signingIn : t.signInGoogle}
              </a>
            </div>
          )}

          {me && (
            <nav aria-label={t.title} className="flex flex-col border-t border-line">
              <Link href={me.tag ? accountHref : `${accountHref}?next=${encodeURIComponent(here)}`} onClick={() => setOpen(false)} className={row}>
                <span aria-hidden className="hex h-4.25 w-5 flex-none bg-acc2" />
                <span className="min-w-0 flex-1 font-display text-[17px] font-semibold tracking-[0.06em] uppercase">{me.tag ? t.account : t.chooseTag}</span>
                <span aria-hidden className="font-mono text-fg-dim">→</span>
              </Link>
            </nav>
          )}

          {me && (
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="mt-auto self-end px-2 py-2.5 font-mono text-xs font-bold tracking-[0.12em] text-acc3 uppercase underline underline-offset-4 hover:no-underline disabled:opacity-60"
            >
              {t.signOut}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
