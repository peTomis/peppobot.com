import "server-only";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { IMAGE_NAME } from "./images";

/** Public host of the bucket (CloudFront); also listed in both next.config.ts files. */
const MEDIA_URL = "https://media.peppobot.com";

/** Accepted image types and the extension each is stored with. */
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

// Credentials come from AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in maker/.env.
let client: S3Client | null = null;

/**
 * Uploads `file` as image `name` of game `id`, at `games/<id>/<name>.<ext>`, and returns its public URL.
 * The URL carries a version so a replaced image with the same extension skips the old cached copy.
 */
export async function putGameImage(id: string, name: string, file: File): Promise<string> {
  const extension = EXTENSIONS[file.type];
  if (!extension) throw new Error(`Unsupported image type "${file.type || "unknown"}". Use JPEG, PNG, WebP or AVIF.`);
  if (!IMAGE_NAME.test(name)) throw new Error(`Invalid image name "${name}". Use lowercase letters, digits, "_" and "-".`);
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) throw new Error("Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in maker/.env.");

  client ??= new S3Client({ region: process.env.AWS_REGION || "eu-central-1" });
  const key = `games/${id}/${name}.${extension}`;
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET || "peppobot",
      Key: key,
      Body: new Uint8Array(await file.arrayBuffer()),
      ContentType: file.type,
    }),
  );
  return `${MEDIA_URL}/${key}?v=${Date.now()}`;
}
