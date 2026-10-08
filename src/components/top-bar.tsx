"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { LOCALE_COOKIE, localizePath, locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { ACCENTS, NAV, NavItem, isActive } from "./nav";

type TopBarProps = {
  lang: Locale;
  nav: Dictionary["nav"];
  strings: Dictionary["topBar"];
};

/** Reads the route; `cacheComponents` requires it to sit inside <Suspense>. */
export function ActiveTopBar(props: TopBarProps) {
  return <TopBar pathname={usePathname()} {...props} />;
}

export function TopBar({ pathname, lang, nav, strings: t }: TopBarProps & { pathname: string | null }) {
  const home = localizePath("/", lang);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const desktop = window.matchMedia("(min-width: 47.5rem)");
    const close = () => setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    desktop.addEventListener("change", close);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      desktop.removeEventListener("change", close);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className={`sticky top-0 z-30 border-b-2 bg-bg transition-colors ${scrolled ? "border-acc2" : "border-transparent"}`}>
      {/* Desktop */}
      <div className="flex-wrap items-center hidden gap-6 px-6 py-3 mx-auto max-w-310 desk:flex">
        <Link href={home} className="flex items-center gap-3 text-fg hover:text-fg">
          <LogoBadge />
          <span className="flex flex-col gap-0.5">
            <span className="font-display text-lg leading-none font-bold tracking-[0.14em]">PEPPOBOT</span>
            <span className="font-mono text-[10px] tracking-[0.12em] text-fg-dim">{t.tagline}</span>
          </span>
        </Link>
        <LanguageSwitch pathname={pathname} lang={lang} label={t.language} />
        <nav className="ml-auto flex flex-wrap gap-0.5">
          {NAV.map((item) => {
            const on = isActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={localizePath(item.href, lang)}
                aria-current={on ? "page" : undefined}
                className={`border-b-2 px-3.5 py-2.5 font-display text-sm font-semibold tracking-[0.12em] uppercase hover:text-white ${
                  on ? "border-acc text-fg" : "border-transparent text-fg-dim"
                }`}
              >
                {nav[item.key]}
              </Link>
            );
          })}
        </nav>
        <Online>{t.online}</Online>
      </div>

      {/* Mobile */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 desk:hidden">
        <Link href={home} className="flex items-center gap-2.5 text-fg hover:text-fg">
          <LogoBadge />
          <span className="font-display text-lg leading-none font-bold tracking-[0.14em]">PEPPOBOT</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <LanguageSwitch pathname={pathname} lang={lang} label={t.language} onSwitch={() => setMenuOpen(false)} />
          <button
            type="button"
            aria-label={menuOpen ? t.closeMenu : t.openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
            className={`hex flex h-11.25 w-13 cursor-pointer flex-col items-center justify-center gap-1 ${menuOpen ? "bg-acc2" : "bg-acc"}`}
          >
            <span className={`h-0.5 w-4.5 bg-bg transition-transform ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`h-0.5 w-4.5 bg-bg ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-4.5 bg-bg transition-transform ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" className="fixed inset-x-0 top-16.25 bottom-0 z-40 flex flex-col gap-1.5 overflow-y-auto bg-bg px-4 pt-6 pb-8 desk:hidden">
          {NAV.map((item: NavItem, i) => {
            const on = isActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={localizePath(item.href, lang)}
                aria-current={on ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                style={{ "--c": ACCENTS[i % 2] } as CSSProperties}
                className={`flex w-full items-center gap-4 px-4 py-3.5 [clip-path:polygon(0_0,calc(100%-20px)_0,100%_20px,100%_100%,0_100%)] ${on ? "bg-(--c)" : "bg-surface"}`}
              >
                <span className={`hex grid h-9.5 w-11 shrink-0 place-items-center font-mono text-[13px] font-bold ${on ? "bg-bg text-(--c)" : "bg-(--c) text-bg"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`font-display text-[30px] leading-none font-bold tracking-[0.04em] uppercase ${on ? "text-bg" : "text-fg"}`}>{nav[item.key]}</span>
              </Link>
            );
          })}
          <div className="pt-6 mt-auto">
            <Online>
              {t.online} · {t.tagline}
            </Online>
          </div>
        </nav>
      )}
    </header>
  );
}

/** Squared logo badge, shared by the desktop and mobile bars. */
function LogoBadge() {
  return (
    <span className="grid size-10.5 place-items-center border border-acc bg-black">
      <Image draggable={false} src="/peppobot.png" alt="Peppobot" width={32} height={32} priority className="invert mix-blend-screen" />
    </span>
  );
}

function Online({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-fg-dim">
      <span className="rounded-full size-2 bg-[#05b105]" />
      {children}
    </div>
  );
}

function LanguageSwitch({ pathname, lang, label, onSwitch }: { pathname: string | null; lang: Locale; label: string; onSwitch?: () => void }) {
  return (
    <nav aria-label={label} className="flex items-center gap-0.5 font-mono text-xs font-bold tracking-widest">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-0.5">
          {i > 0 && <span className="text-line">|</span>}
          <Link
            href={localizePath(pathname, l)}
            hrefLang={l}
            lang={l}
            aria-current={l === lang ? "true" : undefined}
            onClick={() => {
              document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
              onSwitch?.();
            }}
            className={`px-2 py-1.25 uppercase ${l === lang ? "bg-acc text-bg" : "text-fg-dim hover:text-white"}`}
          >
            {l}
          </Link>
        </span>
      ))}
    </nav>
  );
}
