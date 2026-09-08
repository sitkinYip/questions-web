import { uiCopy } from "@/config/ui-copy";
import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type VideoHTMLAttributes,
} from "react";
import { Button } from "@/components/ui/Button";

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
      {uiCopy.nativeVideo.unsupported}
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
      {uiCopy.nativeVideo.unsupported}
    </video>
  );

  return (
    <>
      {renderVideo ? renderVideo(video) : video}
      {hasPlayed && (
        <div className="video-sound-control">
          <span>
            {muted ? uiCopy.nativeVideo.muted : uiCopy.nativeVideo.unmuted}
          </span>
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
            {muted ? uiCopy.nativeVideo.unmute : uiCopy.nativeVideo.mute}
          </Button>
        </div>
      )}
    </>
  );
}
