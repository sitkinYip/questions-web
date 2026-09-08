import type { GameAssignment, GameContentBlock } from "@/api/game.contracts";
import { desktopAssignment } from "@e2e/desktop-preview-data";

export const questionImages = ["landscape", "portrait", "square"].map(
  (shape) => `/e2e/assets/question-${shape}.svg`,
);

export const imageContent: GameContentBlock[] = questionImages.map((url) => ({
  imageUrl: url,
  imageUrls: [],
  videoUrl: "",
  text: "观察星图，寻找北方。",
  hint: "",
}));

/** A single image question for local visual review, with no CDN dependency. */
export const imageAssignment: GameAssignment = {
  ...desktopAssignment,
  currentIndex: 0,
  completedLevels: 0,
  totalLevels: 1,
  clues: [],
  levels: [
    {
      ...desktopAssignment.levels[0],
      completedAt: "",
      question: {
        id: "image-question",
        kind: "text",
        title: "",
        placeholder: "输入你的答案",
        content: [imageContent[0]],
        options: [],
      },
    },
  ],
};
