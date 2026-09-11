import { useState, type ReactNode } from "react";
import {
  MediaViewer,
  type MediaViewerState,
} from "@/features/media/MediaViewer";

import { MediaPreviewContext } from "@/features/media/media-preview-context";

/** Lives above dialogs so opening media can suspend, then restore their content. */
export function MediaPreviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MediaViewerState>(null);
  return (
    <MediaPreviewContext.Provider value={setState}>
      {children}
      <MediaViewer
        state={state}
        onClose={() => setState(null)}
        onImageIndexChange={(index) =>
          setState((value) =>
            value?.type === "images" ? { ...value, index } : value,
          )
        }
        onVideoPlayingChange={() => {}}
      />
    </MediaPreviewContext.Provider>
  );
}
