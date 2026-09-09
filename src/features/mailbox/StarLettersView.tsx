import { SparkleIcon } from "@phosphor-icons/react";
import { formatGameDate } from "@/features/game/game-presentation";
import { uiCopy } from "@/config/ui-copy";
import { MailboxRow } from "./MailboxRow";
import type { StarLetter } from "./star-letters";

export function StarLettersView({
  letters,
  onOpen,
}: {
  letters: readonly StarLetter[];
  onOpen: (letter: StarLetter) => void;
}) {
  return (
    <div className="notification-letters">
      {letters.map((letter) => (
        <MailboxRow
          key={letter.id}
          title={letter.title}
          summary={letter.description || uiCopy.mailbox.stars}
          meta={
            <>
              <span>{letter.sessionTitle}</span>
              <time dateTime={letter.sentAt}>
                {formatGameDate(letter.sentAt)}
              </time>
            </>
          }
          icon={<SparkleIcon weight="thin" />}
          onOpen={() => onOpen(letter)}
        />
      ))}
    </div>
  );
}
