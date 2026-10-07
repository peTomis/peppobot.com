import { connection } from "next/server";
import { getData } from "@/lib/data";

export async function GET() {
  await connection();
  try {
    return Response.json(await getData(), { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
  } catch {
    return Response.json({ error: "Site data is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
