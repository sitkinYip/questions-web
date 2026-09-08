import { uiCopy } from "@/config/ui-copy";
import type { QuestContentItem } from "@/domain/quest/types";
import { RichContent } from "@/features/content/RichContent";

interface QuestContentProps {
  items: readonly QuestContentItem[];
  fallback: string;
  onOpenImages: (urls: readonly string[], index?: number) => void;
  onOpenVideo: (url: string, poster?: string) => void;
}

function uniqueImages(item: QuestContentItem): string[] {
  return Array.from(
    new Set([...(item.imageUrl ? [item.imageUrl] : []), ...item.imageUrls]),
  );
}

export function QuestContent({
  items,
  fallback,
  onOpenImages,
  onOpenVideo,
}: QuestContentProps) {
  if (items.length === 0) {
    return <RichContent className="quest-prompt" source={fallback} />;
  }

  return (
    <div className="quest-content">
      {items.map((item, itemIndex) => {
        const images = uniqueImages(item);
        return (
          <section className="quest-content-item" key={itemIndex}>
            {item.videoUrl ? (
              <button
                type="button"
                className="video-poster-button"
                onClick={() => onOpenVideo(item.videoUrl!, item.imageUrl)}
                aria-label={uiCopy.questContent.playVideo(itemIndex + 1)}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={uiCopy.questContent.videoPoster}
                    loading="lazy"
                  />
                ) : (
                  <span className="video-placeholder">
                    {uiCopy.questContent.videoPlaceholder}
                  </span>
                )}
                <span className="play-badge" aria-hidden="true">
                  ▶
                </span>
              </button>
            ) : images.length > 0 ? (
              <div
                className={
                  images.length > 1 ? "question-gallery" : "question-image"
                }
              >
                {images.map((url, index) => (
                  <button
                    type="button"
                    key={url}
                    onClick={() => onOpenImages(images, index)}
                    aria-label={uiCopy.questContent.viewImage(index + 1)}
                  >
                    <img
                      src={url}
                      alt={uiCopy.questContent.imageAlt(index + 1)}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            ) : null}

            {item.text && (
              <RichContent className="quest-prompt" source={item.text} />
            )}
            {item.hint && (
              <details className="quest-hint">
                <summary>{uiCopy.questContent.hint}</summary>
                <RichContent source={item.hint} />
              </details>
            )}
          </section>
        );
      })}
    </div>
  );
}
