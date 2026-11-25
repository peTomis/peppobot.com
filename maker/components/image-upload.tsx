"use client";

import { createContext, useContext, useTransition } from "react";
import { uploadImage } from "../app/actions";
import { IMAGE_NAME, IMAGE_TYPES, imageNameFrom } from "../lib/images";
import { buttonClass } from "./fields";

/** What the upload buttons need from the editor: the saved game's id (null while new), the image names in use, and where to report errors. */
export type ImageUploadContext = { gameId: string | null; usedNames: Set<string>; onError: (error: string | null) => void };

export const UploadContext = createContext<ImageUploadContext>({ gameId: null, usedNames: new Set(), onError: () => {} });

/** Asks for the image name, suggesting one from the file; null when cancelled. */
function askName(fileName: string, usedNames: Set<string>): string | null {
  let suggestion = imageNameFrom(fileName);
  for (;;) {
    const answer = window.prompt("Image name in the bucket (games/<id>/<name>.<ext>), e.g. art or mount_1:", suggestion);
    if (answer === null) return null;
    const name = answer.trim();
    suggestion = name;
    if (!IMAGE_NAME.test(name)) window.alert('Use lowercase letters, digits, "_" and "-", starting with a letter or digit.');
    else if (name === "cover") window.alert('"cover" is reserved for the cover image.');
    else if (!usedNames.has(name) || window.confirm(`"${name}" is already used by another image of this game. Replace it?`)) return name;
  }
}

/**
 * Uploads an image of the game to the bucket and passes its URL to `onUploaded`.
 * With `name` (the cover) it uploads under that name; otherwise it asks for one.
 */
export function UploadButton({ name, onUploaded }: { name?: string; onUploaded: (url: string) => void }) {
  const { gameId, usedNames, onError } = useContext(UploadContext);
  const [uploading, startUploading] = useTransition();
  const disabled = !gameId || uploading;

  const upload = (file: File) => {
    if (!gameId) return;
    const target = name ?? askName(file.name, usedNames);
    if (!target) return;
    startUploading(async () => {
      onError(null);
      const form = new FormData();
      form.set("file", file);
      const result = await uploadImage(gameId, target, form);
      if (result.ok) onUploaded(result.url);
      else onError(result.error);
    });
  };

  return (
    <label title={gameId ? undefined : "Save the game before uploading images"} className={`${buttonClass} grid shrink-0 place-items-center ${disabled ? "pointer-events-none opacity-40" : "cursor-pointer"}`}>
      {uploading ? "Uploading…" : "Upload…"}
      <input
        type="file"
        accept={IMAGE_TYPES}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) upload(file);
        }}
      />
    </label>
  );
}
