import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { gameRequest, isFatalGameError } from "@/api/game.client";
import { gameNarrativeSchema } from "@/api/narrative.schema";
import {
  resolveAppBasename,
  withAppBasename,
} from "@/shared/navigation/app-base";
import { LetterExperience } from "@/features/letter/LetterExperience";
import { BlessExperience } from "@/features/bless/BlessExperience";
import { GameFailure, GameHeader } from "@/features/game/GameContext";
import { useGame } from "@/features/game/useGame";
import { GameLoadingScreen } from "@/features/game/components/GameLoadingScreen";

export function GameNarrativePage() {
  const { id = "", contentId = "" } = useParams(),
    { player } = useGame();
  const query = useQuery({
    queryKey: ["game", player.id, "narrative", id, contentId],
    queryFn: ({ signal }) =>
      gameRequest(
        `/assignments/${encodeURIComponent(id)}/narratives/${encodeURIComponent(contentId)}`,
        { signal, schema: gameNarrativeSchema },
      ),
    gcTime: 0,
  });
  if (query.isPending)
    return <GameLoadingScreen scene="narrative" header={<GameHeader />} />;
  if (query.isError && (!query.data || isFatalGameError(query.error)))
    return (
      <main className="game-shell">
        <GameHeader />
        <GameFailure error={query.error} retry={() => void query.refetch()} />
      </main>
    );
  const data = query.data!;
  const appBasename = resolveAppBasename(
    import.meta.env.BASE_URL,
    window.location.pathname,
  );
  const returnTo = withAppBasename(`/play/${id}`, appBasename);
  return data.kind === "letter" ? (
    <LetterExperience
      letter={{
        ...data.payload,
        id: data.id,
        title: data.title,
        revision: data.id,
      }}
      returnTo={returnTo}
    />
  ) : (
    <BlessExperience
      blessing={{
        ...data.payload,
        id: data.id,
        title: data.title,
        revision: data.id,
      }}
      returnTo={returnTo}
    />
  );
}
