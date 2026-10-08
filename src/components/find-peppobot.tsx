import Image from "next/image";
import type { CSSProperties } from "react";
import { getDictionary } from "@/i18n/dictionaries";

type Gametag = { name: string; handle: string; url?: string; icon: string; color: string };

const GAMETAGS: Gametag[] = [
  { name: "PlayStation Network", handle: "Peppobot", url: "https://psnprofiles.com/Peppobot", icon: "playstation", color: "#0070D1" },
  { name: "Xbox Live", handle: "Peppobot", url: "https://www.xbox.com/it-IT/play/user/Peppobot", icon: "xbox", color: "#107C10" },
  { name: "Steam", handle: "peppobot", url: "https://steamcommunity.com/id/peppobot/", icon: "steam", color: "#7C3AED" },
  { name: "Epic Games", handle: "Peppobot", icon: "epicgames", color: "#FFFFFF" },
  { name: "Nintendo Switch", handle: "0000-0000-0000", icon: "nintendo-switch", color: "#E60012" },
  { name: "Twitch", handle: "peppobot", url: "https://www.twitch.tv/Peppobot/videos", icon: "twitch", color: "#9146FF" },
  { name: "YouTube", handle: "@peppobot", url: "https://www.youtube.com/channel/UCPecHHhLdmwXsgOpa8ELVmw", icon: "youtube", color: "#FF0000" },
  { name: "Discord", handle: "peppobot", icon: "discord", color: "#5865F2" },
];

export async function FindPeppobot() {
  const { findPeppobot: t } = await getDictionary();

  return (
    <section aria-labelledby="find-peppobot" className="bg-acc text-bg">
      <div className="flex flex-col px-6 mx-auto max-w-310 gap-9 py-18">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <h2 id="find-peppobot" className="flex flex-wrap gap-4 font-display text-[clamp(36px,5vw,64px)] leading-[0.9] font-bold uppercase">
            <span>{t.find}</span>
            <span className="text-transparent [-webkit-text-stroke:2px_var(--bg)]">Peppobot</span>
          </h2>
          <span className="font-mono text-xs font-bold tracking-[0.16em]">{t.tagline}</span>
        </div>

        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
          {GAMETAGS.map((tag) => {
            const Card = tag.url ? "a" : "div";

            return (
              <li key={tag.name}>
                <Card
                  {...(tag.url ? { href: tag.url, target: "_blank", rel: "noopener noreferrer" } : {})}
                  style={{ "--c": tag.color } as CSSProperties}
                  className={`flex items-center gap-4 bg-bg px-4.5 py-4 text-fg [clip-path:polygon(0_0,calc(100%-18px)_0,100%_18px,100%_100%,0_100%)]${tag.url ? " hover:bg-surface-hover hover:text-fg" : ""}`}
                >
                  <span className="hex grid h-11.25 w-13 shrink-0 place-items-center bg-(--c)">
                    <Image draggable={false} src={`/icons/${tag.icon}.svg`} alt="" width={22} height={22} className={tag.icon === "epicgames" ? "brightness-0" : "brightness-0 invert"} />
                  </span>
                  <span className="flex flex-col min-w-0 gap-1">
                    <span className="font-mono text-[10px] tracking-[0.16em] text-fg-dim uppercase">{tag.name}</span>
                    <span className="truncate font-display text-[19px] font-bold">{tag.handle}</span>
                  </span>
                  {tag.url && (
                    <span aria-hidden className="ml-auto font-mono text-base text-(--c)">
                      ↗
                    </span>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
