import { describe, expect, it } from "vitest";
import { adaptLevelRecord } from "./level.adapter";
import { levelRecordSchema } from "./level.schema";

describe("PocketBase level contract", () => {
  it("accepts null JSON fields returned by unconfigured PocketBase records", () => {
    const result = levelRecordSchema.parse({
      id: "record-id",
      step: 11,
      type: "FillInTheBlank",
      question: [{ text: "问题" }],
      answer: "答案",
      answerList: null,
      options: null,
      penaltyConfig: null,
      thread: null,
      updated: "2026-08-24 12:00:00.000Z",
    });

    expect(result.answerList).toEqual([]);
    expect(result.options).toEqual([]);
    expect(result.penaltyConfig).toEqual([]);
    expect(result.thread).toEqual([]);
    expect(adaptLevelRecord(result)).toMatchObject({
      step: 11,
      kind: "text",
      acceptedAnswers: ["答案"],
    });
  });

  it("adapts safe direct question and option media while dropping unsafe URLs", () => {
    const record = levelRecordSchema.parse({
      id: "media-level",
      step: 12,
      type: "MultipleChoice",
      question: [
        {
          text: "观察画面",
          img: "https://img.example/cover.jpg",
          imgList: ["/assets/detail.jpg", "javascript:alert(1)"],
          video: "https://video.example/movie.mp4",
        },
      ],
      answer: "A",
      options: [
        {
          key: "A",
          img: "data:text/html,unsafe",
          video: "https://video.example/option.mp4",
        },
      ],
      updated: "2026-08-24 12:00:00.000Z",
    });

    const quest = adaptLevelRecord(record);
    expect(quest.content[0]).toEqual({
      text: "观察画面",
      hint: undefined,
      imageUrl: "https://img.example/cover.jpg",
      imageUrls: ["/assets/detail.jpg"],
      videoUrl: "https://video.example/movie.mp4",
    });
    expect(quest.options[0]).toMatchObject({
      imageUrl: undefined,
      videoUrl: "https://video.example/option.mp4",
    });
  });

  it("adapts every supported clue type and rejects unsafe clue URLs", () => {
    const record = levelRecordSchema.parse({
      id: "clue-level",
      step: 13,
      question: [{ text: "问题" }],
      answer: "答案",
      thread: [
        { type: "text", content: "密卷", state: "AutoPlay" },
        {
          type: "img",
          content: "影像",
          url: "https://img.example/a.jpg",
          imgList: ["/b.jpg", "javascript:bad"],
        },
        { type: "video", content: "回放", url: "https://video.example/a.mp4" },
        { type: "url", content: "出口", url: "https://example.com/path" },
        {
          type: "letter",
          content: "来信",
          path: "/letter",
          query: { id: "42" },
        },
        { type: "url", content: "危险", url: "javascript:alert(1)" },
      ],
      updated: "2026-08-24 12:00:00.000Z",
    });

    expect(adaptLevelRecord(record).clues).toEqual([
      expect.objectContaining({
        kind: "text",
        autoPlay: true,
        content: "密卷",
      }),
      expect.objectContaining({
        kind: "image",
        imageUrls: ["https://img.example/a.jpg", "/b.jpg"],
      }),
      expect.objectContaining({
        kind: "video",
        url: "https://video.example/a.mp4",
      }),
      expect.objectContaining({
        kind: "link",
        href: "https://example.com/path",
        linkTarget: "external",
      }),
      expect.objectContaining({
        kind: "letter",
        href: "/letter?id=42",
        linkTarget: "internal",
      }),
    ]);
  });

  it("adapts a safe final destination with its configured query", () => {
    const record = levelRecordSchema.parse({
      id: "final-level",
      step: 52,
      question: [{ text: "最终问题" }],
      answer: "答案",
      isFinalLevel: true,
      FinalLevelConfig: {
        path: "/bless",
        query: { from: "questions" },
      },
      updated: "2026-08-24 12:00:00.000Z",
    });

    expect(adaptLevelRecord(record)).toMatchObject({
      isFinal: true,
      finalDestination: {
        href: "/bless?from=questions",
        target: "internal",
      },
    });
  });

  it("adapts displayable rank metadata", () => {
    const record = levelRecordSchema.parse({
      id: "rank-level",
      step: 31,
      question: [{ text: "等级问题" }],
      answer: "答案",
      rank: "3",
      rankName: "守护咪",
      updated: "2026-08-25 12:00:00.000Z",
    });

    expect(adaptLevelRecord(record).rank).toEqual({
      code: "3",
      name: "守护咪",
      isSpecial: false,
      numericValue: 3,
    });
  });

  it("adapts a safe trimmed BGM URL and drops unsafe audio", () => {
    const baseRecord = {
      id: "audio-level",
      step: 41,
      question: [{ text: "聆听" }],
      answer: "答案",
      updated: "2026-08-25 12:00:00.000Z",
    };
    expect(
      adaptLevelRecord(
        levelRecordSchema.parse({
          ...baseRecord,
          mainAudio: " https://audio.example/quest.mp3 ",
        }),
      ).mainAudioUrl,
    ).toBe("https://audio.example/quest.mp3");
    expect(
      adaptLevelRecord(
        levelRecordSchema.parse({
          ...baseRecord,
          mainAudio: "javascript:alert(1)",
        }),
      ).mainAudioUrl,
    ).toBeUndefined();
  });

  it("adapts safe quest background and traveler avatar URLs", () => {
    const record = levelRecordSchema.parse({
      id: "visual-level",
      step: 42,
      question: [{ text: "观察旅途" }],
      answer: "答案",
      mainBgImg: "https://img.example/background.jpg",
      avatar: "https://img.example/avatar.jpg",
      updated: "2026-08-25 12:00:00.000Z",
    });

    expect(adaptLevelRecord(record)).toMatchObject({
      backgroundImageUrl: "https://img.example/background.jpg",
      avatarUrl: "https://img.example/avatar.jpg",
    });
  });
});
