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
    <div className="mailbox-list">
      {letters.map((letter) => {
        const finale =
          letter.title === uiCopy.mailbox.finale &&
          !!letter.sessionTitle &&
          letter.description === letter.sessionTitle;
        const title = finale ? letter.sessionTitle : letter.title;
        const source = finale ? letter.title : letter.sessionTitle;
        const summary = letter.description.trim();
        return (
          <MailboxRow
            key={letter.id}
            title={title}
            summary={
              summary === title.trim() || summary === source.trim()
                ? ""
                : summary
            }
            meta={
              <>
                {source && source !== title && <span>{source}</span>}
                <time dateTime={letter.sentAt}>
                  {formatGameDate(letter.sentAt)}
                </time>
              </>
            }
            icon={<SparkleIcon weight="regular" />}
            onOpen={() => onOpen(letter)}
          />
        );
      })}
    </div>
  );
}
