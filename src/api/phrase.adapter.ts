import { sanitizeMediaUrl } from "../domain/content/parser";
import type { Blessing, BlessLine } from "../domain/bless/types";
import type { PhraseRecord } from "./phrase.schema";

function adaptLine(
  line: PhraseRecord["phraseList"][number],
  defaultDurationMs: number,
): BlessLine {
  const audioUrl = line.audio ? sanitizeMediaUrl(line.audio) : null;
  return {
    text: line.text,
    durationMs: line.duration ?? defaultDurationMs,
    ...(audioUrl ? { audioUrl } : {}),
  };
}

export function adaptPhraseRecord(record: PhraseRecord): Blessing {
  const mainAudioUrl = record.mainAudio
    ? sanitizeMediaUrl(record.mainAudio)
    : null;
  return {
    id: record.id,
    from: record.from,
    title: record.title ?? undefined,
    phrases: record.phraseList.map((line) => adaptLine(line, 5_000)),
    closingLines: record.takeABowList.map((line) => adaptLine(line, 2_500)),
    ...(mainAudioUrl ? { mainAudioUrl } : {}),
    revision: record.updated,
  };
}
