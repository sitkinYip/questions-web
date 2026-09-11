import { createContext, useContext } from "react";
import type { MediaViewerState } from "@/features/media/MediaViewer";
export const MediaPreviewContext = createContext<
  ((state: MediaViewerState) => void) | null
>(null);
export const useMediaPreview = () => useContext(MediaPreviewContext);
