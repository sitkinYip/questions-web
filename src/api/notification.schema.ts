import { z } from "zod";

export const notificationRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().default(""),
  content: z.string().default(""),
  popupTitle: z.string().nullish(),
  buttonText: z.string().nullish(),
  enabled: z.boolean(),
  user: z.string().nullish(),
  created: z.string().default(""),
  updated: z.string().default(""),
});

export const notificationsResponseSchema = z.object({
  items: z.array(notificationRecordSchema),
});

export type NotificationRecord = z.infer<typeof notificationRecordSchema>;
