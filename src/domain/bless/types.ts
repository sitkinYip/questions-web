export interface BlessLine {
  text: string;
  audioUrl?: string;
  durationMs: number;
}

export interface Blessing {
  id: string;
  from: string;
  title?: string;
  phrases: BlessLine[];
  closingLines: BlessLine[];
  mainAudioUrl?: string;
  revision: string;
}
