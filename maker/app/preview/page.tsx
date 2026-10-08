"use client";

import { useEffect, useState } from "react";
import { GameReport } from "@/components/game-report";
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
      <GameReport
        report={{ game: message.game, number: message.number, prev: null, next: null }}
        lang={message.lang}
        t={dict.report}
        statuses={dict.library.statuses}
        genreAxes={dict.protocol.genreAxes}
      />
    </main>
  );
}
