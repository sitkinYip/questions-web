import { describe, expect, it } from "vitest";
import { multiQuestCluesResponseSchema } from "./multi-clue.schema";

describe("PocketBase multi quest clue contract", () => {
  it("accepts the nullable optional fields used by live records", () => {
    const result = multiQuestCluesResponseSchema.parse({
      items: [
        {
          id: "combined",
          qas: "11,12,13",
          content: "共同线索",
          title: "隐藏真相",
          buttonText: null,
          desc: null,
          updated: "2026-08-24 12:00:00.000Z",
        },
      ],
      page: 1,
      perPage: 1,
      totalItems: 1,
      totalPages: 1,
    });

    expect(result.items[0]).toMatchObject({
      qas: "11,12,13",
      buttonText: null,
      desc: null,
    });
  });
});
