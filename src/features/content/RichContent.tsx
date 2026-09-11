import { useMediaPreview } from "@/features/media/media-preview-context";
import { useState } from "react";
import {
  MediaViewer,
  type MediaViewerState,
} from "@/features/media/MediaViewer";
import { uiCopy } from "@/config/ui-copy";
import { Link } from "react-router-dom";
import { parseLegacyContent } from "@/domain/content/parser";
import { NativeVideo } from "@/features/media/NativeVideo";

interface RichContentProps {
  source: string;
  className?: string;
  tabIndex?: number;
}

export function RichContent({ source, className, tabIndex }: RichContentProps) {
  const [media, setLocalMedia] = useState<MediaViewerState>(null);
  const sharedPreview = useMediaPreview();
  const setMedia = sharedPreview ?? setLocalMedia;
  const segments = parseLegacyContent(source);

  const images = segments
    .filter((segment) => segment.type === "image")
    .map((segment) => segment.url);
  return (
    <>
      <div className={className} tabIndex={tabIndex}>
        {segments.map((segment, index) => {
          const key = `${segment.type}-${index}`;
          switch (segment.type) {
            case "text":
              return <span key={key}>{segment.content}</span>;
            case "highlight":
              return <mark key={key}>{segment.content}</mark>;
            case "break":
              return <br key={key} />;
            case "link":
              return segment.target === "internal" ? (
                <Link key={key} to={segment.href}>
                  {segment.content}
                </Link>
              ) : (
                <a
                  key={key}
                  href={segment.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {segment.content}
                </a>
              );
            case "image":
              return (
                <button
                  key={key}
                  className="rich-media-trigger"
                  type="button"
                  aria-label="放大查看图片"
                  onClick={() =>
                    setMedia({
                      type: "images",
                      urls: images,
                      index: images.indexOf(segment.url),
                    })
                  }
                >
                  <img
                    src={segment.url}
                    alt={uiCopy.richContent.label}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </button>
              );
            case "video":
              return (
                <div key={key} className="rich-media-video">
                  <NativeVideo
                    src={segment.url}
                    poster={segment.poster}
                    controls
                    preload="metadata"
                  />
                  <button
                    className="game-action-link"
                    type="button"
                    onClick={(event) => {
                      event.currentTarget.parentElement
                        ?.querySelector("video")
                        ?.pause();
                      setMedia({
                        type: "video",
                        url: segment.url,
                        poster: segment.poster,
                      });
                    }}
                  >
                    展开视频
                  </button>
                </div>
              );
          }
        })}
      </div>
      <MediaViewer
        state={media}
        onClose={() => setMedia(null)}
        onImageIndexChange={(index) =>
          setLocalMedia((value) =>
            value?.type === "images" ? { ...value, index } : value,
          )
        }
        onVideoPlayingChange={() => {}}
      />
    </>
  );
}
