import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { localizePath, type Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getLatestReports } from "@/lib/games";
import { ReportCard } from "./game-cards";
import { SectionHeading } from "./section-heading";

type Strings = Awaited<ReturnType<typeof getDictionary>>["latestReports"];

// One accent per card, in order.
const ACCENTS = ["var(--acc)", "var(--acc2)", "var(--acc3)"];

/** Home section 02: the three most recently completed games. */
export async function LatestReports() {
  const [lang, { latestReports: t }] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <Suspense>
      <LatestReportsSection lang={lang} t={t} />
    </Suspense>
  );
}

async function LatestReportsSection({ lang, t }: { lang: Locale; t: Strings }) {
  // MongoDB's driver reads the clock; defer its work until a request arrives.
  await connection();
  const games = await getLatestReports(ACCENTS.length);
  if (!games.length) return null;

  return (
    <section aria-labelledby="latest-reports" className="flex flex-col gap-10 px-6 pb-32 mx-auto w-full max-w-310">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <SectionHeading id="latest-reports" index="02" first={t.latest} second={t.reports} accent="acc2" />
        <Link
          href={localizePath("/library", lang)}
          className="bg-acc2 py-3.5 pr-7.5 pl-5.5 font-display text-sm font-bold tracking-[0.12em] text-bg uppercase [clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)] hover:bg-fg hover:text-bg"
        >
          {t.allReports}
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-7 desk:grid-cols-3">
        {games.map((game, index) => (
          <li key={game.id}>
            <ReportCard game={game} lang={lang} accent={ACCENTS[index]} />
          </li>
        ))}
      </ul>
    </section>
  );
}
