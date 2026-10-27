import {
  readStorageItem,
  writeStorageItem,
} from "@/infrastructure/storage/namespace";
import { z } from "zod";

export const MULTI_CLUE_LAUNCHER_POSITION_KEY =
  "starward:v1:multi-clue-launcher";

const floatingPositionSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export interface MultiClueLauncherPosition {
  x: number;
  y: number;
}

export function createMultiClueLauncherPositionRepository(
  storage: Pick<Storage, "getItem" | "setItem">,
) {
  return {
    load(): MultiClueLauncherPosition | null {
      try {
        const raw = readStorageItem(storage, MULTI_CLUE_LAUNCHER_POSITION_KEY);
        if (!raw) return null;
        const parsed = floatingPositionSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : null;
      } catch {
        return null;
      }
    },
    save(position: MultiClueLauncherPosition) {
      writeStorageItem(
        storage,
        MULTI_CLUE_LAUNCHER_POSITION_KEY,
        JSON.stringify(position),
      );
    },
  };
}
