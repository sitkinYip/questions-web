import { describe, expect, it } from "vitest";
import { adaptPhraseRecord } from "@/api/phrase.adapter";
import { phraseRecordSchema, phrasesResponseSchema } from "@/api/phrase.schema";

describe("PocketBase phrase contract", () => {
  it("normalizes nullable lists and optional media", () => {
    const record = phraseRecordSchema.parse({
      id: "phrase-final",
      from: "final",
      title: null,
      phraseList: null,
      takeABowList: null,
      mainAudio: null,
      updated: "2026-08-25 12:00:00.000Z",
    });

    expect(adaptPhraseRecord(record)).toMatchObject({
      from: "final",
      phrases: [],
      closingLines: [],
    });
  });

  it("adapts durations and drops unsafe audio URLs", () => {
    const record = phraseRecordSchema.parse({
      id: "phrase-safe",
      from: "final",
      phraseList: [
        {
          text: "第一幕",
          duration: 1200,
          audio: "https://audio.example/voice.mp3",
        },
        { text: "第二幕", audio: "javascript:alert(1)" },
      ],
      takeABowList: [{ text: "谢幕" }],
      mainAudio: "/audio/stars.mp3",
      updated: "2026-08-25 12:00:00.000Z",
    });

    expect(adaptPhraseRecord(record)).toMatchObject({
      phrases: [
        {
          text: "第一幕",
          durationMs: 1200,
          audioUrl: "https://audio.example/voice.mp3",
        },
        { text: "第二幕", durationMs: 5000 },
      ],
      closingLines: [{ text: "谢幕", durationMs: 2500 }],
      mainAudioUrl: "/audio/stars.mp3",
    });
  });

  it("validates the PocketBase list envelope", () => {
    expect(
      phrasesResponseSchema.parse({
        items: [],
        page: 1,
        perPage: 500,
        totalItems: 0,
        totalPages: 0,
      }).items,
    ).toEqual([]);
  });
});
