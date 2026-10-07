import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { nav } = await getDictionary();
  return { title: nav.library, alternates: await localizedAlternates("/library") };
}

export default function LibraryPage() {
  return <main className="mx-auto w-full max-w-[1240px] flex-1 px-6" />;
}
