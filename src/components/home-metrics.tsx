"use client";

import { useEffect, useState } from "react";

import type { LibraryStats } from "@/content/games";

export function HomeMetrics({ lang, loggedLabel, hoursLabel, averageLabel }: { lang: string; loggedLabel: string; hoursLabel: string; averageLabel: string }) {
  const [metrics, setMetrics] = useState<LibraryStats | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/games/metrics", { signal: controller.signal, cache: "default" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load metrics");
        return response.json() as Promise<LibraryStats>;
      })
      .then(setMetrics)
      .catch(() => {
        /* Leave unavailable values as dashes instead of fake zeroes. */
      });
    return () => controller.abort();
  }, []);

  const number = new Intl.NumberFormat(lang);
  const score = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const kpis = [
    { value: metrics ? number.format(metrics.count) : "—", label: loggedLabel, bg: "bg-acc" },
    { value: metrics ? number.format(metrics.hours) : "—", label: hoursLabel, bg: "bg-acc2" },
    { value: metrics?.avgScore != null ? score.format(metrics.avgScore) : "—", label: averageLabel, bg: "bg-[#232323] text-white" },
  ];

  return (
    <dl className="grid grid-cols-3 pt-2 desk:flex desk:flex-wrap">
      {kpis.map((kpi) => (
        <div key={kpi.label} className={`flex min-w-0 flex-col-reverse gap-1 px-3 py-4 text-bg desk:min-w-30 desk:px-5.5 ${kpi.bg}`}>
          <dt className="font-mono text-[clamp(8px,2.4vw,10px)] tracking-[0.12em] desk:text-[10px] desk:tracking-[0.16em]">{kpi.label}</dt>
          <dd className="font-mono text-[clamp(22px,7vw,30px)] leading-none font-bold desk:text-[30px]">{kpi.value}</dd>
        </div>
      ))}
    </dl>
  );
}
