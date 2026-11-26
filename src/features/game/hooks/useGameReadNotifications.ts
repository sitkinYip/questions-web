import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { GameApiError, authState, gameApi } from "@/api/game.client";
import {
  GAME_NOTIFICATION_READ_BATCH_LIMIT,
  type GameHome,
  type GameNotification,
  type GameNotificationReadAllResult,
} from "@/api/game.contracts";
import { gameReadReceiptSchema } from "@/api/game.schema";
import { uiCopy } from "@/config/ui-copy";
import { gameKeys, invalidateGameList } from "@/features/game/game-queries";
import { useGame } from "@/features/game/useGame";

type Receipt = GameNotificationReadAllResult["items"][number];

function applyReadReceipts(
  client: QueryClient,
  playerId: string,
  receipts: Receipt[],
) {
  if (!receipts.length) return;
  const byId = new Map(receipts.map((receipt) => [receipt.id, receipt.readAt]));
  const update = (list: { items: GameNotification[] }) => ({
    items: list.items.map((note) => {
      const readAt = byId.get(note.id);
      return readAt ? { ...note, readAt } : note;
    }),
  });
  client.setQueryData<GameHome | null>(gameKeys.home(playerId), (home) =>
    home ? { ...home, notifications: update(home.notifications) } : home,
  );
  client.setQueryData<GameHome["notifications"]>(
    gameKeys.notifications(playerId),
    (list) => (list ? update(list) : list),
  );
}

export function useGameReadNotifications() {
  const { player } = useGame();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      bulk = false,
    }: {
      ids: readonly string[];
      bulk?: boolean;
    }) => {
      const owner = authState.get();
      const current = () =>
        authState.get() === owner && (!owner || owner.playerId === player.id);
      const checkOwner = () => {
        if (!current()) {
          throw new GameApiError("CANCELLED", uiCopy.gameClient.accountChanged);
        }
      };
      const receipts: Receipt[] = [];
      const keys = [
        gameKeys.home(player.id),
        gameKeys.notifications(player.id),
      ];
      const targets = [...new Set(ids)];
      const readIndividually = async (remaining: string[]) => {
        for (const id of remaining) {
          checkOwner();
          const read = gameReadReceiptSchema.safeParse(
            await gameApi.readNotification(id),
          );
          if (read.success) receipts.push({ id, readAt: read.data.readAt });
        }
      };

      try {
        if (!bulk) {
          await readIndividually(targets);
          return;
        }
        for (
          let offset = 0;
          offset < targets.length;
          offset += GAME_NOTIFICATION_READ_BATCH_LIMIT
        ) {
          checkOwner();
          const chunk = targets.slice(
            offset,
            offset + GAME_NOTIFICATION_READ_BATCH_LIMIT,
          );
          try {
            const read = await gameApi.readNotifications({ ids: chunk });
            const requested = new Set(chunk);
            if (read.items.some(({ id }) => !requested.delete(id))) {
              throw new GameApiError(
                "CONTRACT_ERROR",
                uiCopy.gameClient.incompatibleVersion,
              );
            }
            receipts.push(...read.items);
          } catch (error) {
            if (!(error instanceof GameApiError) || error.status !== 404)
              throw error;
            await readIndividually(targets.slice(offset));
            break;
          }
        }
      } finally {
        if (current()) {
          // A poll started before the write may still contain the old unread state.
          await Promise.all(
            keys.map((queryKey) => client.cancelQueries({ queryKey })),
          );
          if (current()) {
            applyReadReceipts(client, player.id, receipts);
            await invalidateGameList(client, player.id, "notifications");
          }
        }
      }
    },
  });
}
