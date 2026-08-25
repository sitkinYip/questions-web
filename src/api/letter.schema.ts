import { z } from "zod";

const paragraphSchema = z.object({
  content: z.string(),
  align: z
    .enum(["left", "center", "right", "top", "bottom"])
    .nullish()
    .transform((value) => value ?? "left"),
  delay: z
    .number()
    .int()
    .nonnegative()
    .nullish()
    .transform((value) => value ?? 0),
  audio: z.string().nullish(),
});

export const letterRecordSchema = z.object({
  id: z.string(),
  from: z.string(),
  type: z.enum(["modern", "classical", "magic"]),
  title: z.string().nullish(),
  desc: z.string().nullish(),
  hintText: z.string().nullish(),
  paragraphConfigList: z
    .array(paragraphSchema)
    .nullish()
    .transform((value) => value ?? []),
  bgImages: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
  bgImg: z.string().nullish(),
  mainAudio: z.string().nullish(),
  speed: z.number().int().positive().nullish(),
  updated: z.string(),
});

export const lettersResponseSchema = z.object({
  items: z.array(letterRecordSchema),
  page: z.number(),
  perPage: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export type LetterRecord = z.infer<typeof letterRecordSchema>;
