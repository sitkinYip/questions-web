import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.url().default("https://api.sitkin.top/api/collections"),
  VITE_ANALYTICS_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  VITE_ANALYTICS_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.url().optional(),
  ),
});

export const env = envSchema.parse(import.meta.env);
