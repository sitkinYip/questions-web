import { levelsResponseSchema } from "@/api/level.schema.ts";
import { adaptLevelRecord } from "@/api/level.adapter.ts";

const origin =
  process.env.QUESTIONS_LOCAL_ORIGIN ?? "http://local.sitkin.top:5173";
let input = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) input += chunk;

const result = levelsResponseSchema.safeParse(JSON.parse(input));
if (!result.success) {
  console.error(result.error.issues);
  throw new Error("PocketBase response does not match the local Zod contract");
}

const quests = result.data.items.map(adaptLevelRecord);

console.log(
  JSON.stringify(
    {
      origin,
      parsedItems: result.data.items.length,
      totalItems: result.data.totalItems,
      steps: result.data.items.map((item) => item.step),
      media: {
        questBgm: quests.filter((quest) => quest.mainAudioUrl).length,
        questBackgrounds: quests.filter((quest) => quest.backgroundImageUrl)
          .length,
        travelerAvatars: quests.filter((quest) => quest.avatarUrl).length,
        uniqueQuestBgm: new Set(
          quests.flatMap((quest) => quest.mainAudioUrl ?? []),
        ).size,
        questionImages: quests.reduce(
          (count, quest) =>
            count +
            quest.content.reduce(
              (itemCount, item) =>
                itemCount + item.imageUrls.length + (item.imageUrl ? 1 : 0),
              0,
            ),
          0,
        ),
        questionVideos: quests.reduce(
          (count, quest) =>
            count + quest.content.filter((item) => item.videoUrl).length,
          0,
        ),
        optionImages: quests.reduce(
          (count, quest) =>
            count + quest.options.filter((option) => option.imageUrl).length,
          0,
        ),
        optionVideos: quests.reduce(
          (count, quest) =>
            count + quest.options.filter((option) => option.videoUrl).length,
          0,
        ),
      },
      clues: {
        total: quests.reduce((count, quest) => count + quest.clues.length, 0),
        autoPlay: quests.reduce(
          (count, quest) =>
            count + quest.clues.filter((clue) => clue.autoPlay).length,
          0,
        ),
        byKind: Object.fromEntries(
          ["text", "image", "video", "link", "letter"].map((kind) => [
            kind,
            quests.reduce(
              (count, quest) =>
                count + quest.clues.filter((clue) => clue.kind === kind).length,
              0,
            ),
          ]),
        ),
      },
      finalLevels: quests
        .filter((quest) => quest.isFinal)
        .map((quest) => ({
          step: quest.step,
          hasDestination: Boolean(quest.finalDestination),
          autoPlayClues: quest.clues.filter((clue) => clue.autoPlay).length,
        })),
      ranks: {
        withRank: quests.filter((quest) => quest.rank).length,
        eligibleUpgrades: Array.from(
          new Set(
            quests
              .filter(
                (quest) =>
                  quest.rank &&
                  (quest.rank.isSpecial || quest.rank.numericValue > 1),
              )
              .map((quest) => quest.rank?.code),
          ),
        ),
        highestNumeric: Math.max(
          0,
          ...quests.map((quest) =>
            quest.rank && !quest.rank.isSpecial ? quest.rank.numericValue : 0,
          ),
        ),
      },
    },
    null,
    2,
  ),
);
