import { getGame } from "@/lib/games";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const game = await getGame(id);
    if (!game) {
      return Response.json({ error: "Game not found." }, { status: 404 });
    }
    return Response.json({ game }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Game data is temporarily unavailable." }, { status: 503 });
  }
}
