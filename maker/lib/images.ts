import type { KeyedBlock } from "./draft";

/** Image names in the bucket, as in `games/<id>/<name>.<ext>`: short, lowercase, e.g. `art` or `mount_1`. */
export const IMAGE_NAME = /^[a-z0-9][a-z0-9_-]*$/;

export const IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/avif";

/** A suggested image name from a file name: `Zipline Map.PNG` → `zipline_map`. */
export function imageNameFrom(fileName: string) {
  return fileName
    .replace(/\.[^.]*$/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Names of the game's images already in use in the draft (cover and blocks), read from their bucket URLs. */
export function usedImageNames(id: string, cover: string, blocks: KeyedBlock[]) {
  const sources = [cover, ...blocks.flatMap(({ block }) => (block.type === "image" ? [block.image.src] : block.type === "pair" ? block.images.map((image) => image.src) : []))];
  const pattern = new RegExp(`/games/${id}/([^/.?]+)\\.`);
  return new Set(sources.flatMap((src) => src?.match(pattern)?.[1] ?? []));
}
