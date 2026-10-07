import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache, Suspense } from "react";
import { GameReport } from "@/components/game-report";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/metadata";
import { pickTranslation } from "@/i18n/translations";
import { getGameReport } from "@/lib/games";

// Metadata and page share one lookup per request.
const loadReport = cache(async (id: string) => {
  // MongoDB's driver reads the clock; defer its work until a request arrives.
  await connection();
  return getGameReport(decodeURIComponent(id));
});

export async function generateMetadata({ params }: PageProps<"/[lang]/library/[id]">): Promise<Metadata> {
  const [{ id }, lang] = await Promise.all([params, getLocale()]);
  const report = await loadReport(id);
  if (!report) return {};
  const description = pickTranslation(report.game.description, lang)?.value;
  return { title: report.game.title, description, alternates: await localizedAlternates(`/library/${id}`) };
}

export default function GamePage({ params }: PageProps<"/[lang]/library/[id]">) {
  return (
    <main className="w-full px-6 pt-10 pb-16 mx-auto flex-1 max-w-310">
      <Suspense>
        <Report params={params} />
      </Suspense>
    </main>
  );
}

async function Report({ params }: { params: PageProps<"/[lang]/library/[id]">["params"] }) {
  const [{ id }, lang, dict] = await Promise.all([params, getLocale(), getDictionary()]);
  const report = await loadReport(id);
  if (!report) notFound();
  return <GameReport report={report} lang={lang} t={dict.report} statuses={dict.library.statuses} />;
}
