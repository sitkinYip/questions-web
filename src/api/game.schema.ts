import { z } from "zod";
import { sanitizeMediaUrl } from "@/domain/content/parser";
import type {
  GameAssignment,
  GamePlayer,
  GameAnswerResult,
  GameReward,
  GameNotification,
  GameAssignmentSummary,
  GameClue,
} from "@/api/game.contracts";

const media = z
  .string()
  .transform((value) => (value ? (sanitizeMediaUrl(value) ?? "") : ""));
export const gameRankSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  name: z.string(),
  minTotalXp: z.number().int(),
  visualConfig: z.unknown(),
});
export const gamePlayerSchema: z.ZodType<GamePlayer> = z.object({
  id: z.string(),
  account: z.string(),
  displayName: z.string(),
  avatar: z.string(),
  mustChangePassword: z.boolean(),
  totalXp: z.number().int().nonnegative(),
  level: gameRankSchema,
  nextLevel: gameRankSchema.nullable(),
});
const presentation = z.object({
  backgroundMode: z.enum(["inherit", "custom", "none"]).optional(),
  hideTitle: z.boolean().optional(),
  bgmMode: z.enum(["inherit", "custom", "silent"]).optional(),
  bgmUrl: media.optional(),
  backgroundUrl: media.optional(),
  completionStyle: z.enum(["normal", "finale"]).optional(),
});
const summary = z.object({
  id: z.string(),
  player: z.string(),
  session: z.string(),
  status: z.enum(["assigned", "active", "completed", "cancelled"]),
  order: z.number(),
  startsAt: z.string(),
  endsAt: z.string(),
  startedAt: z.string(),
  completedAt: z.string(),
  previousAssignment: z.string(),
  title: z.string(),
  description: z.string(),
  minLevel: z.number(),
  maxLevel: z.number().nullable(),
  completedLevels: z.number(),
  totalLevels: z.number(),
});
export const gameAssignmentSummarySchema: z.ZodType<GameAssignmentSummary> =
  summary;
const question = z.object({
  id: z.string(),
  kind: z.enum(["text", "choice"]),
  title: z.string(),
  placeholder: z.string(),
  content: z.array(
    z.object({
      text: z.string(),
      hint: z.string(),
      imageUrl: media,
      imageUrls: z.array(media),
      videoUrl: media,
    }),
  ),
  options: z.array(
    z.object({
      key: z.string(),
      text: z.string(),
      imageUrl: media,
      videoUrl: media,
    }),
  ),
});
const gameClue = z.preprocess(
  (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return value;
    const clue = { ...(value as Record<string, unknown>) };
    if (!clue.source) clue.source = "session";
    if (!clue.definitionId) clue.definitionId = clue.id;
    if (clue.question === undefined) clue.question = "";
    return clue;
  },
  z.object({
    id: z.string(),
    source: z.enum(["session", "question"]),
    definitionId: z.string().min(1),
    question: z.string(),
    sessionLevel: z.string(),
    trigger: z.enum([
      "start",
      "level_completed",
      "session_completed",
      "manual",
      "question_completed",
    ]),
    kind: z.enum(["text", "image", "video", "link", "letter", "bless"]),
    position: z.number(),
    narrative: z.string(),
    autoPlay: z.boolean(),
    unlockedAt: z.string(),
    content: z.object({
      title: z.string(),
      text: z.string(),
      url: media,
      imageUrls: z.array(media),
      buttonText: z.string(),
      description: z.string().optional(),
      tips: z.string().optional(),
    }),
  }),
);
export const gameClueEffectSchema = z.object({
  type: z.literal("clue"),
  clueId: z.string(),
  autoPlay: z.boolean().optional(),
});
export const gameClueSchema: z.ZodType<GameClue> = gameClue.superRefine(
  (clue, context) => {
    if (clue.source !== "question") return;
    for (const [field, value] of [
      ["question", clue.question],
      ["sessionLevel", clue.sessionLevel],
    ] as const)
      if (!value)
        context.addIssue({
          code: "custom",
          path: [field],
          message: `Question clue requires ${field}`,
        });
    if (clue.trigger !== "question_completed")
      context.addIssue({
        code: "custom",
        path: ["trigger"],
        message: "Question clue requires question_completed",
      });
    if (clue.kind === "letter" || clue.kind === "bless")
      context.addIssue({
        code: "custom",
        path: ["kind"],
        message: "Question clues cannot reference narratives",
      });
  },
);
export const gameAssignmentSchema: z.ZodType<GameAssignment> = summary.extend({
  presentation,
  completionTarget: z
    .discriminatedUnion("kind", [
      z.object({ kind: z.literal("narrative"), id: z.string() }),
      z.object({ kind: z.literal("link"), url: media }),
    ])
    .nullable(),
  currentIndex: z.number().int(),
  serverTime: z.string(),
  levels: z.array(
    z.object({
      id: z.string(),
      position: z.number(),
      xp: z.number(),
      autoNext: z.boolean(),
      completedAt: z.string(),
      wrongCount: z.number(),
      cooldownUntil: z.string(),
      locked: z.boolean(),
      presentationOverride: presentation,
      question: question.nullable(),
      lastAnswer: z.string(),
    }),
  ),
  clues: z.array(gameClueSchema),
  transitionEffects: z.array(gameClueEffectSchema).optional(),
});
export const gameAnswerSchema: z.ZodType<GameAnswerResult> = z.object({
  result: z.enum(["correct", "incorrect", "already_completed"]),
  xpDelta: z.number(),
  rewardIds: z.array(z.string()),
  effects: z.array(gameClueEffectSchema).optional(),
  assignment: gameAssignmentSchema,
  player: gamePlayerSchema,
});
export const gameRewardSchema: z.ZodType<GameReward> = z.object({
  id: z.string(),
  player: z.string(),
  assignment: z.string(),
  quantity: z.number(),
  status: z.enum(["available", "redeemed", "voided"]),
  claimDetails: z.string(),
  redeemedAt: z.string(),
  created: z.string(),
  snapshot: z.object({
    id: z.string(),
    name: z.string(),
    image: media,
    description: z.string(),
    claimMethod: z.enum(["staff", "location", "locker"]),
    publicInstructions: z.string(),
  }),
});
export const gameNotificationSchema: z.ZodType<GameNotification> = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  popupTitle: z.string(),
  buttonText: z.string(),
  sentAt: z.string(),
  readAt: z.string(),
  assignmentId: z.string(),
});
export const listOf = <T>(schema: z.ZodType<T>) =>
  z.object({ items: z.array(schema) });
