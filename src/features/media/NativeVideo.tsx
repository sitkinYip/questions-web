import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type VideoHTMLAttributes,
} from "react";
import { Button } from "../../components/ui/Button";

const browserVideoAttributes = {
  // renderer: "hybrid",
  // "keep-stack": "true",
} as const;

type NativeVideoProps = Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  "children" | "muted"
> & {
  src: string;
  renderVideo?: (video: ReactNode) => ReactNode;
};

export function NativeVideo(props: NativeVideoProps) {
  // An opt-in workaround for these browsers, not a guarantee against takeover.
  const startMuted =
    typeof navigator !== "undefined" &&
    /Quark|UCBrowser|UCWEB|UCTurbo/i.test(navigator.userAgent);

  if (startMuted) return <MutedVideo key={props.src} {...props} />;

  const { renderVideo, ...videoProps } = props;
  const video = (
    <video {...videoProps} {...browserVideoAttributes}>
      当前浏览器无法播放此视频。
    </video>
  );
  return renderVideo ? renderVideo(video) : video;
}

function MutedVideo({
  renderVideo,
  onPlay,
  onVolumeChange,
  ...videoProps
}: NativeVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [hasPlayed, setHasPlayed] = useState(false);
  const attachVideo = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    // React sets the muted property; also expose the initial HTML attribute.
    if (video) video.defaultMuted = true;
  }, []);
  const video = (
    <video
      {...videoProps}
      {...browserVideoAttributes}
      ref={attachVideo}
      muted={muted}
      playsInline
      webkit-playsinline=""
      data-muted-start="true"
      onPlay={(event) => {
        setHasPlayed(true);
        onPlay?.(event);
      }}
      onVolumeChange={(event) => {
        setMuted(event.currentTarget.muted);
        onVolumeChange?.(event);
      }}
    >
      当前浏览器无法播放此视频。
    </video>
  );

  return (
    <>
      {renderVideo ? renderVideo(video) : video}
      {hasPlayed && (
        <div className="video-sound-control">
          <span>{muted ? "视频已静音" : "声音已开启"}</span>
          <Button
            size="small"
            onClick={() => {
              const element = videoRef.current;
              if (!element) return;
              // Keep unmuting synchronous with the user's gesture.
              element.muted = !element.muted;
              setMuted(element.muted);
            }}
          >
            {muted ? "开启声音" : "静音"}
          </Button>
        </div>
      )}
    </>
  );
}
