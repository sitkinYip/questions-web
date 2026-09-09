import { z } from "zod";
import { uiCopy } from "@/config/ui-copy";
import { sanitizeMediaUrl } from "@/domain/content/parser";

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
export const gameNarrativeSchema = z.discriminatedUnion("kind", [
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
