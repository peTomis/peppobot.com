"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const inputClass =
  "min-w-0 flex-[1_1_280px] border-b-3 border-acc bg-surface py-4 pr-7 pl-4.5 font-mono text-sm text-fg outline-none placeholder:text-fg-faint focus:bg-surface-hover [clip-path:polygon(0_0,100%_0,calc(100%-10px)_100%,0_100%)]";

/** Free-text search; writes `?q=` after a short pause and returns to page 1. */
export function LibrarySearch({ placeholder, label }: { placeholder: string; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const timer = setTimeout(() => {
      const query = value.trim();
      if (query === (searchParams.get("q") ?? "")) return;
      const next = new URLSearchParams(searchParams);
      if (query) next.set("q", query);
      else next.delete("q");
      next.delete("page");
      router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [value, searchParams, pathname, router]);

  return <input type="search" value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} aria-label={label} className={inputClass} />;
}

/** Same field before the URL is known: shown in the prerendered shell. */
export function LibrarySearchFallback({ placeholder, label }: { placeholder: string; label: string }) {
  return <input type="search" disabled placeholder={placeholder} aria-label={label} className={inputClass} />;
}
