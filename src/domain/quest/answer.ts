import type { Quest } from "./types";

const ignoredCharacters = /[\s\p{P}]/gmu;

export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFKC")
    .replace(ignoredCharacters, "")
    .toLocaleLowerCase();
}

export function isAcceptedAnswer(quest: Quest, input: string): boolean {
  const normalizedInput = normalizeAnswer(input);
  if (!normalizedInput) return false;

  return quest.acceptedAnswers.some(
    (answer) => normalizeAnswer(answer) === normalizedInput,
  );
}
