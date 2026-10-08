import type { Metadata } from "next";
import { Suspense } from "react";
import { TelemetryKpis, TelemetrySections } from "@/components/telemetry";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { nav } = await getDictionary();
  return { title: nav.telemetry, alternates: await localizedAlternates("/telemetry") };
}

// The heading is prerendered; the figures stream in from the `data` document.
export default async function TelemetryPage() {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const t = dict.telemetry;

  return (
    <main className="flex flex-col flex-1 w-full gap-24 px-6 pt-10 pb-16 mx-auto max-w-310 desk:pt-18">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 font-mono text-xs tracking-[0.18em] text-acc">
            <span className="hex h-3 w-3.5 bg-acc" />
            {t.diagnostics}
          </div>
          <h1 className="flex flex-col items-start gap-2 font-display text-[clamp(56px,8vw,112px)] leading-[0.86] font-bold uppercase">
            <span className="text-fg">{t.title[0]}</span>
            <span className="translate-x-3.5 -rotate-3 bg-acc px-4.5 pt-1 text-bg">{t.title[1]}</span>
          </h1>
        </div>
        <Suspense>
          <TelemetryKpis lang={lang} t={t} />
        </Suspense>
      </div>

      <Suspense>
        <TelemetrySections lang={lang} t={t} axisNames={dict.report.axes.map((axis) => axis.name)} />
      </Suspense>
    </main>
  );
}
