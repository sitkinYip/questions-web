import { Link } from "react-router-dom";
import { parseLegacyContent } from "../../domain/content/parser";

interface RichContentProps {
  source: string;
  className?: string;
}

export function RichContent({ source, className }: RichContentProps) {
  const segments = parseLegacyContent(source);

  return (
    <div className={className}>
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
              <img
                key={key}
                src={segment.url}
                alt="题目内容"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            );
          case "video":
            return (
              <video
                key={key}
                src={segment.url}
                poster={segment.poster}
                controls
                preload="metadata"
              >
                当前浏览器无法播放此视频。
              </video>
            );
        }
      })}
    </div>
  );
}
