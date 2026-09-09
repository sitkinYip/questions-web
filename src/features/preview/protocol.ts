import { gameAssignmentSchema } from "@/api/game.schema";
import { gameNarrativeSchema } from "@/api/narrative.schema";
import { z } from "zod";
import { EDITOR_PREVIEW_VERSION } from "@/api/game.contracts";
const text = z.string().max(200_000);
const media = z
  .string()
  .max(8000)
  .refine((value) => {
    if (!value) return true;
    try {
      return ["https:", "http:"].includes(
        new URL(value, window.location.origin).protocol,
      );
    } catch {
      return false;
    }
  });
const block = z.object({
  text,
  hint: text,
  imageUrl: media,
  imageUrls: z.array(media).max(500),
  videoUrl: media,
});
const option = z.object({ key: text, text, imageUrl: media, videoUrl: media });
export const previewMessageSchema = z.object({
  type: z.literal("sitkin:preview:update"),
  version: z.literal(EDITOR_PREVIEW_VERSION),
  channel: z.string().min(1).max(100),
  revision: z.number().int().nonnegative(),
  reset: z.number().int().nonnegative(),
  theme: z.enum(["light", "dark"]),
  state: z.enum([
    "unanswered",
    "incorrect",
    "completed",
    "unread",
    "read",
    "popup",
  ]),
  draft: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("session"),
      value: z.object({
        assignment: gameAssignmentSchema,
        narratives: z.array(gameNarrativeSchema),
        issues: z.array(text),
      }),
    }),
    z.object({ kind: z.literal("narrative"), value: gameNarrativeSchema }),
    z.object({
      kind: z.literal("question"),
      value: z.object({
        id: text,
        kind: z.enum(["text", "choice"]),
        title: text,
        placeholder: text,
        content: z.array(block).max(500),
        options: z.array(option).max(500),
      }),
    }),
    z.object({
      kind: z.literal("notification"),
      value: z.object({
        title: text,
        content: text,
        popupTitle: text,
        buttonText: text,
      }),
    }),
  ]),
});
export type ValidatedPreviewMessage = z.infer<typeof previewMessageSchema>;

export function allowedPreviewOrigin(
  origin: string,
  development: boolean,
  configured = "",
) {
  const allowed = [
    "https://vae.sitkin.top",
    ...configured
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ];
  if (allowed.includes(origin)) return true;
  if (!development) return false;
  try {
    const url = new URL(origin);
    return (
      url.origin === origin &&
      ["http:", "https:"].includes(url.protocol) &&
      ["localhost", "127.0.0.1", "local.sitkin.top"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}
