import { adaptLetterRecord } from "@/api/letter.adapter.ts";
import { lettersResponseSchema } from "@/api/letter.schema.ts";

let input = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) input += chunk;

const result = lettersResponseSchema.safeParse(JSON.parse(input));
if (!result.success) {
  console.error(result.error.issues);
  throw new Error(
    "PocketBase Letter response does not match the local Zod contract",
  );
}

const letters = result.data.items.map(adaptLetterRecord);
console.log(
  JSON.stringify(
    {
      parsedItems: letters.length,
      variants: Object.fromEntries(
        ["modern", "classical", "magic"].map((variant) => [
          variant,
          letters.filter((letter) => letter.variant === variant).length,
        ]),
      ),
      paragraphs: letters.reduce(
        (count, letter) => count + letter.paragraphs.length,
        0,
      ),
      paragraphAudio: letters.reduce(
        (count, letter) =>
          count +
          letter.paragraphs.filter((paragraph) => paragraph.audioUrl).length,
        0,
      ),
      mainAudio: letters.filter((letter) => letter.mainAudioUrl).length,
      backgroundImages: letters.reduce(
        (count, letter) => count + letter.backgroundImages.length,
        0,
      ),
    },
    null,
    2,
  ),
);
