import {
  readStorageItem,
  writeStorageItem,
} from "@/infrastructure/storage/namespace";
import { z } from "zod";

const seenSchema = z.object({
  assignments: z.array(z.string().min(1)),
  rewards: z.array(z.string().min(1)),
});

export type GameSeenActivity = z.infer<typeof seenSchema>;
export type GameActivityKind = keyof GameSeenActivity;

export const gameSeenActivityKey = (playerId: string) =>
  `starward:v1:game-seen-activity:${encodeURIComponent(playerId)}`;

export function readGameSeenActivity(playerId: string): GameSeenActivity {
  try {
    const saved = readStorageItem(localStorage, gameSeenActivityKey(playerId));
    if (saved) return seenSchema.parse(JSON.parse(saved));
  } catch {
    // A corrupt or inaccessible preference must not interfere with gameplay.
  }
  return { assignments: [], rewards: [] };
}

export function writeGameSeenActivity(
  playerId: string,
  activity: GameSeenActivity,
) {
  try {
    writeStorageItem(
      localStorage,
      gameSeenActivityKey(playerId),
      JSON.stringify(activity),
    );
  } catch {
    // The query cache keeps the preference usable for this session.
  }
}
