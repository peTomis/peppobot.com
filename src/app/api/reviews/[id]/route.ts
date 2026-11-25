import { reportAxes } from "@/components/game-report";
import { defaultLocale, hasLocale } from "@/i18n/config";
import en from "@/i18n/dictionaries/en.json";
import it from "@/i18n/dictionaries/it.json";
import { getReviewThread, type AuthoredReview } from "@/lib/reviews";

const DICTIONARIES = { en, it };

/**
 * One crew review and the other reviews by its author, for the review modal: `{ review, others }`,
 * each with its game (`id`, `title`) and the names of its six axes in `?lang=`. Unknown reviews return 404.
 * Not cached: an edited review shows its new text at once.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const langParam = new URL(request.url).searchParams.get("lang") ?? "";
  const lang = hasLocale(langParam) ? langParam : defaultLocale;
  const dict = DICTIONARIES[lang];
  try {
    const thread = await getReviewThread(id);
    if (!thread) return Response.json({ error: "Review not found." }, { status: 404 });
    const shape = ({ game, ...review }: AuthoredReview) => ({
      ...review,
      game: { id: game.id, title: game.title },
      axes: reportAxes(game, lang, dict.report.axes, dict.protocol.genreAxes).map((axis) => axis.name),
    });
    return Response.json({ review: shape(thread.review), others: thread.others.map(shape) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Reviews are temporarily unavailable." }, { status: 503 });
  }
}
