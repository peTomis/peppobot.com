import type { Metadata } from "next";
import { Suspense } from "react";
import { DotHex } from "@/components/dot-hex";
import { ControlsFace, CounterFace, DEFAULT_STATE, LibraryControls, LibraryCounter, LibraryResults, ResultsFallback } from "@/components/library";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { nav } = await getDictionary();
  return { title: nav.library, alternates: await localizedAlternates("/library") };
}

// The heading is prerendered; everything that reads the URL streams in its own boundary.
export default async function LibraryPage({ searchParams }: PageProps<"/[lang]/library">) {
  const [lang, { library: t }] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <main className="flex flex-col flex-1 w-full gap-10 px-6 pb-16 mx-auto max-w-310 pt-10 desk:pt-18">
      <div className="relative flex flex-wrap items-center justify-between gap-8 min-h-60">
        <div className="relative z-1 flex flex-col gap-5">
          <div className="flex items-center gap-3 font-mono text-xs tracking-[0.18em] text-acc">
            <span className="hex h-3 w-3.5 bg-acc" />
            {t.archive}
          </div>
          <h1 className="flex flex-col items-start gap-2 font-display text-[clamp(56px,8vw,112px)] leading-[0.86] font-bold uppercase">
            <span className="text-fg">{t.every}</span>
            <span className="translate-x-3.5 -rotate-3 bg-acc px-4.5 pt-1 text-bg">{t.game}</span>
            <span className="text-transparent [-webkit-text-stroke:2px_var(--acc2)]">{t.logged}</span>
          </h1>
        </div>
        <div className="relative aspect-[1.155] w-[min(100%,300px)]">
          <DotHex fill="var(--acc)" className="absolute top-[34%] left-[-22%] h-auto w-1/2" />
          <Suspense fallback={<CounterFace t={t} />}>
            <LibraryCounter searchParams={searchParams} t={t} />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<ControlsFace state={DEFAULT_STATE} lang={lang} t={t} />}>
        <LibraryControls searchParams={searchParams} lang={lang} t={t} />
      </Suspense>

      <Suspense fallback={<ResultsFallback t={t} />}>
        <LibraryResults searchParams={searchParams} lang={lang} t={t} />
      </Suspense>
    </main>
  );
}
