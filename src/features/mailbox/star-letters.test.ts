import { expect, it } from "vitest";
import { sessionFixture } from "../../../e2e/session-preview-fixture";
import { selectStarLetters } from "./star-letters";

it("collects unlocked letters and blessings, deduplicates finales within a session and keeps separate sessions", () => {
  const assignment = sessionFixture().assignment;
  const base = {
    id: "a",
    source: "session" as const,
    definitionId: "a",
    trigger: "start" as const,
    question: "",
    sessionLevel: "",
    position: 0,
    autoPlay: false,
    content: {
      title: "一封信",
      text: "正文",
      url: "",
      imageUrls: [],
      buttonText: "",
    },
    unlockedAt: "2026-09-09",
    narrative: "letter",
  };
  assignment.clues = [
    { ...base, kind: "letter" },
    { ...base, id: "b", kind: "bless", narrative: "bless" },
    { ...base, id: "c", kind: "text", narrative: "" },
  ];
  assignment.status = "completed";
  assignment.completionTarget = { kind: "narrative", id: "letter" };
  expect(selectStarLetters([assignment])).toHaveLength(2);
  expect(
    selectStarLetters([assignment, { ...assignment, id: "another" }]),
  ).toHaveLength(4);
  expect(selectStarLetters([{ ...assignment, status: "cancelled" }])).toEqual(
    [],
  );
  assignment.clues = [];
  expect(selectStarLetters([{ ...assignment, status: "active" }])).toEqual([]);
  expect(selectStarLetters([assignment])[0].href).toContain("/content/letter");
});
