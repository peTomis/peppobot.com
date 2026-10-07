import { connection } from "next/server";
import { libraryStats } from "@/lib/games";

export async function GET() {
  await connection();
  try {
    return Response.json(await libraryStats(), { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
  } catch {
    return Response.json({ error: "Game metrics are temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
