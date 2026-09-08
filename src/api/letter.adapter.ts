import { uiCopy } from "@/config/ui-copy";
import { sanitizeMediaUrl } from "@/domain/content/parser.ts";
import type { Letter } from "@/domain/letter/types.ts";
import type { LetterRecord } from "@/api/letter.schema.ts";

export function adaptLetterRecord(record: LetterRecord): Letter {
  return {
    id: record.id,
    from: record.from,
    variant: record.type,
    title: record.title ?? undefined,
    description: record.desc ?? undefined,
    hintText:
      record.hintText ??
      (record.type === "classical"
        ? uiCopy.letterAdapter.classicalHint
        : uiCopy.letterAdapter.openHint),
    paragraphs: record.paragraphConfigList.map((paragraph) => ({
      content: paragraph.content,
      align: paragraph.align,
      delayMs: paragraph.delay,
      audioUrl: paragraph.audio
        ? (sanitizeMediaUrl(paragraph.audio) ?? undefined)
        : undefined,
    })),
    backgroundImages: record.bgImages
      .map(sanitizeMediaUrl)
      .filter((url): url is string => Boolean(url)),
    pageBackgroundUrl: record.bgImg
      ? (sanitizeMediaUrl(record.bgImg) ?? undefined)
      : undefined,
    mainAudioUrl: record.mainAudio
      ? (sanitizeMediaUrl(record.mainAudio) ?? undefined)
      : undefined,
    typingSpeedMs: record.speed ?? 80,
    revision: record.updated,
  };
}
