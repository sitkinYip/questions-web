import { describe, expect, it } from "vitest";
import { extraSchema, extraDisplaySchema } from "./extra.schema";
import { gamePlayerSchema } from "./game.schema";
import { makePlayer } from "@/test/game-fixtures";

describe("optional extension protocol", () => {
  it("keeps new namespaces and falsy values without loosening core player fields", () => {
    const result = gamePlayerSchema.parse({
      ...makePlayer(),
      extra: { futureField: { count: 0, enabled: false, text: "" } },
      ignoredRoot: true,
    });
    expect(result.extra).toEqual({
      futureField: { count: 0, enabled: false, text: "" },
    });
    expect(result).not.toHaveProperty("ignoredRoot");
    expect(
      gamePlayerSchema.safeParse({
        ...makePlayer(),
        totalXp: "not an integer",
        extra: {},
      }).success,
    ).toBe(false);
  });
  it("preserves old-server compatibility and isolates broken optional namespaces", () => {
    expect(gamePlayerSchema.parse(makePlayer()).extra).toBeUndefined();
    expect(
      extraSchema.parse({
        good: { text: "可显示" },
        invalid: null,
        huge: "x".repeat(17000),
        badNumber: Infinity,
      }),
    ).toEqual({ good: { text: "可显示" } });
    expect(
      extraSchema.parse(
        JSON.parse('{"constructor":{},"safe":{"__proto__":{}},"valid":true}'),
      ),
    ).toEqual({ valid: true });
  });
  it("accepts custom titles without changing rank identity or XP", () => {
    const player = makePlayer();
    const result = gamePlayerSchema.parse({
      ...player,
      level: {
        ...player.level,
        name: "专属头衔",
        defaultName: player.level.name,
        customTitle: "专属头衔",
      },
    });
    expect(result.level.id).toBe(player.level.id);
    expect(result.totalXp).toBe(player.totalXp);
    expect(result.level.customTitle).toBe("专属头衔");
  });
  it("skips invalid and duplicate render instructions", () => {
    expect(
      extraDisplaySchema.parse([
        { key: "greeting", label: "欢迎", text: "你好" },
        { key: "greeting", label: "重复", text: "重复" },
        { text: 12 },
      ]),
    ).toEqual([{ key: "greeting", label: "欢迎", text: "你好" }]);
  });
});
