"use client";

import { useEffect, useState, type ReactNode } from "react";
import { GameReport } from "@/components/game-report";
import { GridCard, NextInQueueCard, NowPlayingCard, ReportCard } from "@/components/game-cards";
import en from "@/i18n/dictionaries/en.json";
import it from "@/i18n/dictionaries/it.json";
import { READY, type PreviewMessage } from "../../lib/preview";

const DICTIONARIES = { en, it };

/** The site's game page body, fed by the editor through postMessage. */
export default function PreviewPage() {
  const [message, setMessage] = useState<PreviewMessage | null>(null);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === "maker:game") setMessage(event.data);
    };
    window.addEventListener("message", receive);
    window.parent.postMessage(READY, window.location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);

  if (!message) return null;
  const dict = DICTIONARIES[message.lang];

  return (
    // Same frame as the site's game page; links would leave the preview, so they are disabled.
    <main
      className="w-full px-6 pt-10 pb-16 mx-auto flex-1 max-w-310"
      onClickCapture={(event) => {
        if ((event.target as Element).closest("a")) event.preventDefault();
      }}
    >
      {message.view === "images" ? (
        <ImagesPreview message={message} />
      ) : (
        <GameReport
          report={{ game: message.game, number: message.number, prev: null, next: null, mainGame: message.mainGame }}
          lang={message.lang}
          t={dict.report}
          statuses={dict.library.statuses}
          genreAxes={dict.protocol.genreAxes}
        />
      )}
    </main>
  );
}

/** The cover in each card that shows it, in the grids the site lays them out in, so each card gets its real width. */
function ImagesPreview({ message: { game, lang } }: { message: PreviewMessage }) {
  const dict = DICTIONARIES[lang];
  const score = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <div className="flex flex-col gap-16">
      <ImagesSection title="Library grid">
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-x-6 gap-y-9">
          <li>
            <GridCard game={game} lang={lang} score={score} t={dict.library} />
          </li>
        </ul>
      </ImagesSection>
      <ImagesSection title="Home · Now playing">
        <ul className="grid grid-cols-1 gap-6 desk:grid-cols-2">
          <li>
            <NowPlayingCard game={game} lang={lang} progressLabel={dict.nowPlaying.progress} bg="bg-acc" />
          </li>
        </ul>
      </ImagesSection>
      <ImagesSection title="Home · Latest reports">
        <ul className="grid grid-cols-1 gap-7 desk:grid-cols-3">
          <li>
            <ReportCard game={game} lang={lang} accent="var(--acc)" />
          </li>
        </ul>
      </ImagesSection>
      <ImagesSection title="Home · Next in queue">
        <div className="grid grid-cols-1 gap-10 desk:grid-cols-2">
          <div className="hidden desk:block" />
          <NextInQueueCard game={game} lang={lang} label={dict.hallOfFame.nextInQueue} tba={dict.hallOfFame.tba} />
        </div>
      </ImagesSection>
    </div>
  );
}

function ImagesSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="border-b border-line pb-2 font-mono text-xs font-bold tracking-[0.16em] text-fg-dim uppercase">{title}</h2>
      {children}
    </section>
  );
}
