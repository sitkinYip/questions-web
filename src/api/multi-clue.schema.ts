import { z } from "zod";

export const multiQuestClueRecordSchema = z.object({
  id: z.string(),
  qas: z.string(),
  content: z.string(),
  title: z.string().nullish(),
  buttonText: z.string().nullish(),
  desc: z.string().nullish(),
  updated: z.string(),
});

export const multiQuestCluesResponseSchema = z.object({
  items: z.array(multiQuestClueRecordSchema),
  page: z.number(),
  perPage: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});
