import { z } from "zod";

const optionSchema = z.object({
  key: z.string(),
  text: z.string().optional(),
  img: z.string().optional(),
  video: z.string().optional(),
});
const questionSchema = z.object({
  text: z.string().optional(),
  tips: z.string().optional(),
  img: z.string().optional(),
  video: z.string().optional(),
  imgList: z.array(z.string()).optional(),
});
const threadSchema = z.object({
  type: z.enum(["text", "url", "img", "video", "letter"]),
  content: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  url: z.string().nullish(),
  imgList: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
  state: z.string().nullish(),
  path: z.string().nullish(),
  query: z.record(z.string(), z.string()).nullish(),
  title: z.string().nullish(),
  tips: z.string().nullish(),
});
const finalLevelConfigSchema = z.object({
  path: z.string().nullish(),
  link: z.string().nullish(),
  query: z.record(z.string(), z.string()).nullish(),
});

export const levelRecordSchema = z.object({
  id: z.string(),
  step: z.number().int().positive(),
  type: z.enum(["FillInTheBlank", "MultipleChoice"]).optional(),
  title: z.string().optional(),
  question: z.array(questionSchema).default([]),
  answer: z.string(),
  answerList: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
  options: z
    .array(optionSchema)
    .nullish()
    .transform((value) => value ?? []),
  placeholder: z.string().optional(),
  thread: z
    .array(threadSchema)
    .nullish()
    .transform((value) => value ?? []),
  userName: z.string().optional(),
  updated: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  penaltyConfig: z
    .array(z.number().int())
    .nullish()
    .transform((value) => value ?? []),
  autoNext: z.boolean().optional(),
  isFinalLevel: z.boolean().optional(),
  FinalLevelConfig: finalLevelConfigSchema.nullish(),
  mainAudio: z.string().optional(),
  mainBgImg: z.string().optional(),
  avatar: z.string().optional(),
  rank: z.string().optional(),
  rankName: z.string().optional(),
});

export const levelsResponseSchema = z.object({
  items: z.array(levelRecordSchema),
  page: z.number(),
  perPage: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});
export type LevelRecord = z.infer<typeof levelRecordSchema>;
