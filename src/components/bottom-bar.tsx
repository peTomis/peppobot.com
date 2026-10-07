import Image from "next/image";
import { getDictionary } from "@/i18n/dictionaries";

export async function BottomBar() {
  const { bottomBar: t } = await getDictionary();

  return (
    <footer className="bg-acc2 text-bg">
      {/* Desktop */}
      <div className="mx-auto hidden max-w-310 flex-wrap items-center justify-between gap-5 px-6 py-7 font-mono text-[11px] font-bold tracking-[0.12em] desk:flex">
        <span>© 2026 PEPPOBOT · {t.credits}</span>
        <span>
          {t.build} · {t.patched}
        </span>
      </div>

      {/* Mobile */}
      <div className="flex flex-col items-center gap-3.5 px-4 py-8 text-center desk:hidden">
        <span className="grid h-12 hex w-14 place-items-center bg-bg">
          <Image src="/peppobot.png" alt="" width={30} height={30} className="invert mix-blend-screen" />
        </span>
        <span className="font-display text-xl font-bold tracking-[0.16em]">PEPPOBOT</span>
        <span className="font-mono text-[11px] leading-[1.6] font-bold tracking-widest">{t.credits}</span>
        <span className="font-mono text-[10px] tracking-[0.12em] opacity-75">© 2026 · {t.build}</span>
      </div>
    </footer>
  );
}
