import { useQueries } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { gameApi, isFatalGameError } from "@/api/game.client";
import { useAssignments } from "@/features/game/game-queries";
import { useGame } from "@/features/game/useGame";
import {
  GameEmptyState,
  GameFailure,
  GameLoading,
} from "@/features/game/components/GameState";
import { uiCopy } from "@/config/ui-copy";
import { StarLettersView } from "./StarLettersView";
import { selectStarLetters } from "./star-letters";

export function StarLetters() {
  const assignments = useAssignments();
  const { player } = useGame();
  const navigate = useNavigate();
  const queries = useQueries({
    queries: (assignments.data?.items ?? [])
      .filter((item) => item.status !== "cancelled")
      .map((item) => ({
        queryKey: ["game", player.id, "assignment", item.id],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          gameApi.assignment(item.id, signal),
        refetchInterval: 5000,
      })),
  });
  const letters = selectStarLetters(
    queries.flatMap((query) =>
      query.data && !(query.isError && isFatalGameError(query.error))
        ? [query.data]
        : [],
    ),
  );
  const pending =
    assignments.isPending || queries.some((query) => query.isPending);
  const failed = assignments.isError || queries.some((query) => query.isError);
  return (
    <>
      {pending && <GameLoading label={uiCopy.mailbox.starsLoading} />}
      {assignments.isError && (
        <GameFailure
          error={assignments.error}
          retry={() => void assignments.refetch()}
        />
      )}
      {queries
        .filter((query) => query.isError)
        .map((query, index) => (
          <GameFailure
            key={index}
            error={query.error}
            retry={() => void query.refetch()}
          />
        ))}
      <StarLettersView
        letters={letters}
        onOpen={(letter) =>
          navigate(letter.href, { state: { fromMailbox: true } })
        }
      />
      {!pending && !failed && !letters.length && (
        <GameEmptyState title={uiCopy.mailbox.starsEmpty}>
          {uiCopy.mailbox.starsDescription}
        </GameEmptyState>
      )}
    </>
  );
}
