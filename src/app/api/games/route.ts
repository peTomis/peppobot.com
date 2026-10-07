import { getGames } from "@/lib/games";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 50);
  const offset = Number(searchParams.get("offset") ?? 0);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 ||
      !Number.isSafeInteger(offset) || offset < 0) {
    return Response.json({ error: "limit must be 1–100 and offset a non-negative integer." }, { status: 400 });
  }

  try {
    const games = await getGames(limit, offset);
    return Response.json({ games, limit, offset }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Game data is temporarily unavailable." }, { status: 503 });
  }
}
