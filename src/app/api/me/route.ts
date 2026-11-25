import { getViewer } from "@/lib/auth";

/** The signed-in visitor (`{ tag }`, null until chosen), or 401. Read by the top bar after hydration, so pages stay static. */
export async function GET() {
  try {
    const viewer = await getViewer();
    if (!viewer) return Response.json({ error: "Not signed in." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return Response.json({ tag: viewer.tag }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Account data is temporarily unavailable." }, { status: 503 });
  }
}
