import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-start justify-center gap-8 px-6 py-24 mx-auto w-full max-w-[1240px]">
      <div className="flex items-center gap-3 font-mono text-xs tracking-[0.18em] text-acc">
        <span className="h-3 w-3.5 bg-acc [clip-path:polygon(25%_0,75%_0,100%_50%,75%_100%,25%_100%,0_50%)]" />
        FIELD REPORTS · SINCE 1996
      </div>
      <div className="grid h-[83px] w-24 place-items-center bg-acc2 [clip-path:polygon(25%_0,75%_0,100%_50%,75%_100%,25%_100%,0_50%)]">
        <Image
          src="/peppobot.png"
          alt="Peppobot"
          width={56}
          height={56}
          priority
          className="invert mix-blend-screen"
        />
      </div>
      <h1 className="font-display text-[clamp(52px,8vw,124px)] font-bold uppercase leading-[0.86]">
        Peppobot
      </h1>
      <p className="max-w-md text-lg leading-relaxed text-fg-soft">
        Pilot log // game reports. The new site is being built — see{" "}
        <code className="font-mono text-acc">design/</code> and the README.
      </p>
    </main>
  );
}
