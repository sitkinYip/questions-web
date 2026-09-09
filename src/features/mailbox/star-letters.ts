import type { GameAssignment } from "@/api/game.contracts";
import { uiCopy } from "@/config/ui-copy";

export interface StarLetter {
  id: string;
  title: string;
  description: string;
  sessionTitle: string;
  sentAt: string;
  href: string;
}

/** Only server-visible clues and completed finale targets grant mailbox entries. */
export function selectStarLetters(
  assignments: readonly GameAssignment[],
): StarLetter[] {
  const entries = new Map<string, StarLetter>();
  for (const assignment of assignments) {
    if (assignment.status === "cancelled") continue;
    const add = (
      narrative: string,
      title: string,
      description: string,
      sentAt: string,
    ) => {
      const id = `${assignment.id}:${narrative}`;
      if (!narrative || entries.has(id)) return;
      entries.set(id, {
        id,
        title,
        description,
        sessionTitle: assignment.title,
        sentAt,
        href: `/play/${encodeURIComponent(assignment.id)}/content/${encodeURIComponent(narrative)}`,
      });
    };
    for (const clue of assignment.clues) {
      if (clue.kind !== "letter" && clue.kind !== "bless") continue;
      add(
        clue.narrative,
        clue.content.title || uiCopy.mailbox.stars,
        clue.content.description || clue.content.text,
        clue.unlockedAt,
      );
    }
    if (
      assignment.status === "completed" &&
      assignment.completionTarget?.kind === "narrative"
    ) {
      add(
        assignment.completionTarget.id,
        uiCopy.mailbox.finale,
        assignment.title,
        assignment.completedAt,
      );
    }
  }
  return [...entries.values()].sort(
    (a, b) => b.sentAt.localeCompare(a.sentAt) || a.id.localeCompare(b.id),
  );
}
