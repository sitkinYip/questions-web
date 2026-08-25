export type LetterVariant = "modern" | "classical" | "magic";
export type LetterParagraphAlign =
  "left" | "center" | "right" | "top" | "bottom";

export interface LetterParagraph {
  content: string;
  align: LetterParagraphAlign;
  delayMs: number;
  audioUrl?: string;
}

export interface Letter {
  id: string;
  from: string;
  variant: LetterVariant;
  title?: string;
  description?: string;
  hintText: string;
  paragraphs: readonly LetterParagraph[];
  backgroundImages: readonly string[];
  pageBackgroundUrl?: string;
  mainAudioUrl?: string;
  typingSpeedMs: number;
  revision: string;
}
