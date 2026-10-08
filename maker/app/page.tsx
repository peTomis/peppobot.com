import { notFound } from "next/navigation";
import { Maker } from "../components/maker";
import { emptyDraft, toDraft } from "../lib/draft";
import { listGames, loadGame, nextNumber } from "../lib/games";

/** `?id=<MongoDB id>` edits a game; without it the maker starts a new one. */
export default async function MakerPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [games, loaded, number] = await Promise.all([listGames(), id ? loadGame(id) : null, id ? null : nextNumber()]);
  if (id && !loaded) notFound();

  // Keyed by game, so switching games resets the editor's state.
  return <Maker key={id ?? "new"} id={id ?? null} initial={loaded ? toDraft(loaded.game) : emptyDraft()} number={loaded?.number ?? number ?? 1} games={games} />;
}
