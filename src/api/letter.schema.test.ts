import { describe, expect, it } from "vitest";
import { adaptLetterRecord } from "@/api/letter.adapter";
import { letterRecordSchema, lettersResponseSchema } from "@/api/letter.schema";

describe("PocketBase letter contract", () => {
  it("accepts all live variants and normalizes nullable fields", () => {
    for (const type of ["modern", "classical", "magic"] as const) {
      const record = letterRecordSchema.parse({
        id: `letter-${type}`,
        from: type,
        type,
        paragraphConfigList: null,
        bgImages: null,
        bgImg: null,
        mainAudio: null,
        speed: null,
        updated: "2026-08-24 12:00:00.000Z",
      });
      const letter = adaptLetterRecord(record);
      expect(letter).toMatchObject({
        variant: type,
        paragraphs: [],
        backgroundImages: [],
        typingSpeedMs: 80,
      });
    }
  });

  it("adapts paragraphs and drops unsafe media URLs", () => {
    const record = letterRecordSchema.parse({
      id: "letter-safe",
      from: "traveler",
      type: "modern",
      paragraphConfigList: [
        {
          content: "你好",
          align: "center",
          delay: 300,
          audio: "https://audio.example/voice.mp3",
        },
        {
          content: "仍然安全",
          audio: "javascript:alert(1)",
        },
      ],
      bgImages: ["/paper.jpg", "data:text/html,bad"],
      bgImg: "https://img.example/background.jpg",
      mainAudio: "https://audio.example/bgm.mp3",
      speed: 45,
      updated: "2026-08-24 12:00:00.000Z",
    });

    expect(adaptLetterRecord(record)).toMatchObject({
      paragraphs: [
        {
          content: "你好",
          align: "center",
          delayMs: 300,
          audioUrl: "https://audio.example/voice.mp3",
        },
        { content: "仍然安全", audioUrl: undefined },
      ],
      backgroundImages: ["/paper.jpg"],
      pageBackgroundUrl: "https://img.example/background.jpg",
      mainAudioUrl: "https://audio.example/bgm.mp3",
      typingSpeedMs: 45,
    });
  });

  it("validates the PocketBase list envelope", () => {
    expect(
      lettersResponseSchema.parse({
        items: [],
        page: 1,
        perPage: 500,
        totalItems: 0,
        totalPages: 0,
      }).items,
    ).toEqual([]);
  });
});
