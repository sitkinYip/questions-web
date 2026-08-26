import { z } from "zod";

const phraseLineSchema = z.object({
  text: z.string(),
  audio: z.string().nullish(),
  duration: z.number().nonnegative().nullish(),
});

export const phraseRecordSchema = z.object({
  id: z.string(),
  from: z.string(),
  title: z.string().nullish(),
  phraseList: z
    .array(phraseLineSchema)
    .nullish()
    .transform((value) => value ?? []),
  takeABowList: z
    .array(phraseLineSchema)
    .nullish()
    .transform((value) => value ?? []),
  mainAudio: z.string().nullish(),
  updated: z.string(),
});

export const phrasesResponseSchema = z.object({
  items: z.array(phraseRecordSchema),
  page: z.number(),
  perPage: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export type PhraseRecord = z.infer<typeof phraseRecordSchema>;
