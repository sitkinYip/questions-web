import { uiCopy } from "@/config/ui-copy";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { gameRequest, isFatalGameError } from "@/api/game.client";
import { sanitizeMediaUrl } from "@/domain/content/parser";
import {
  resolveAppBasename,
  withAppBasename,
} from "@/shared/navigation/app-base";
import { LetterExperience } from "@/features/letter/LetterExperience";
import { BlessExperience } from "@/features/bless/BlessExperience";
import { GameFailure, GameHeader } from "@/features/game/GameContext";
import { useGame } from "@/features/game/useGame";
import { GameLoadingScreen } from "@/features/game/components/GameLoadingScreen";

const media = z
  .string()
  .optional()
  .transform((value) =>
    value ? sanitizeMediaUrl(value) || undefined : undefined,
  );
const line = z.object({
  text: z.string(),
  audioUrl: media,
  durationMs: z.number().nonnegative().default(3000),
});
const schema = z.discriminatedUnion("kind", [
  z.object({
    id: z.string(),
    kind: z.literal("letter"),
    title: z.string(),
    payload: z.object({
      from: z.string().default(""),
      variant: z.enum(["modern", "classical", "magic"]),
      description: z.string().optional(),
      hintText: z.string().default(uiCopy.gameNarrativePage.openHint),
      paragraphs: z.array(
        z.object({
          content: z.string(),
          align: z
            .enum(["left", "center", "right", "top", "bottom"])
            .default("left"),
          delayMs: z.number().nonnegative().default(0),
          audioUrl: media,
        }),
      ),
      backgroundImages: z
        .array(z.string().transform((url) => sanitizeMediaUrl(url) || ""))
        .default([]),
      pageBackgroundUrl: media,
      mainAudioUrl: media,
      typingSpeedMs: z.number().positive().default(60),
    }),
  }),
  z.object({
    id: z.string(),
    kind: z.literal("bless"),
    title: z.string(),
    payload: z.object({
      from: z.string().default(""),
      phrases: z.array(line),
      closingLines: z.array(line).default([]),
      mainAudioUrl: media,
    }),
  }),
]);
export function GameNarrativePage() {
  const { id = "", contentId = "" } = useParams(),
    { player } = useGame();
  const query = useQuery({
    queryKey: ["game", player.id, "narrative", id, contentId],
    queryFn: ({ signal }) =>
      gameRequest(
        `/assignments/${encodeURIComponent(id)}/narratives/${encodeURIComponent(contentId)}`,
        { signal, schema },
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
