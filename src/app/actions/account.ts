"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { checkTag, type TagError } from "@/content/reviews";
import { defaultLocale, hasLocale, localizePath } from "@/i18n/config";
import { getViewer, safeNext, setTag, signOut } from "@/lib/auth";

export type TagState = { error: TagError | "signedOut" | null; tag: string };

/** Sets the signed-in visitor's crew tag, then goes on to `next`. */
export async function chooseTagAction(_state: TagState, formData: FormData): Promise<TagState> {
  const tag = String(formData.get("tag") ?? "").trim();
  const lang = String(formData.get("lang") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""), localizePath("/", hasLocale(lang) ? lang : defaultLocale));

  const viewer = await getViewer();
  if (!viewer) return { error: "signedOut", tag };
  const invalid = checkTag(tag);
  if (invalid) return { error: invalid, tag };
  if ((await setTag(viewer.id, tag)) === "taken") return { error: "taken", tag };
  redirect(next);
}

/** Signs the visitor out and refreshes the page they are on. */
export async function signOutAction() {
  await signOut();
  refresh();
}
