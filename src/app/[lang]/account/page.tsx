import type { Metadata } from "next";
import { Suspense } from "react";
import { signOutAction } from "@/app/actions/account";
import { SectionHeading } from "@/components/section-heading";
import { TagForm } from "@/components/tag-form";
import { localizePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/i18n/metadata";
import { getViewer, safeNext } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const { account } = await getDictionary();
  // Personal page: kept out of search engines.
  return { ...(await pageMetadata("/account", { title: account.title })), robots: { index: false, follow: false } };
}

/** The visitor's crew account: choose or change their tag, sign out. New members land here after their first sign-in. */
export default async function AccountPage({ searchParams }: PageProps<"/[lang]/account">) {
  const { account: t } = await getDictionary();
  return (
    <main className="mx-auto flex w-full max-w-310 flex-1 flex-col gap-10 px-6 pt-10 pb-16">
      <SectionHeading id="account" index="00" first={t.heading[0]} second={t.heading[1]} accent="acc" />
      <Suspense fallback={<div aria-busy className="h-40 max-w-xl animate-pulse bg-surface" />}>
        <Account searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Account({ searchParams }: { searchParams: PageProps<"/[lang]/account">["searchParams"] }) {
  const [lang, { account: t }, viewer, query] = await Promise.all([getLocale(), getDictionary(), getViewer(), searchParams]);
  const nextParam = typeof query.next === "string" ? query.next : undefined;
  const next = safeNext(nextParam, localizePath("/", lang));

  if (!viewer) {
    return (
      <div className="flex max-w-xl flex-col gap-5">
        <p className="text-lg text-fg-soft">{t.signedOut}</p>
        <a
          href={`/api/auth/google?next=${encodeURIComponent(`${localizePath("/account", lang)}${nextParam ? `?next=${encodeURIComponent(next)}` : ""}`)}`}
          className="self-start bg-acc px-6 py-3.5 font-display text-base font-bold tracking-[0.12em] text-bg uppercase [clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,0_100%)] hover:bg-fg"
        >
          {t.signIn}
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <p className="max-w-[60ch] text-lg leading-[1.6] text-fg-soft">{viewer.tag ? t.changeIntro : t.chooseIntro}</p>
      {viewer.tag && (
        <div className="flex items-center gap-3 font-mono text-sm font-bold tracking-[0.12em]">
          <span className="text-fg-dim">{t.current}</span>
          <span className="bg-acc px-3 py-1.5 text-bg">{viewer.tag}</span>
        </div>
      )}
      <TagForm current={viewer.tag} next={next} lang={lang} t={t} />
      <form action={signOutAction}>
        <button type="submit" className="font-mono text-xs font-bold tracking-[0.12em] text-fg-dim uppercase underline underline-offset-4 hover:text-fg">
          {t.signOut}
        </button>
      </form>
    </div>
  );
}
