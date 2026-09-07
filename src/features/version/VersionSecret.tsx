import { useRef, useState } from "react";
import { CompassIcon, StarFourIcon, XIcon } from "@phosphor-icons/react";
import { AppDialog } from "../../components/ui/Dialog";
import { overlayPriority } from "../../components/ui/overlay-context";

export function VersionSecret() {
  const taps = useRef({ count: 0, last: 0 });
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const build = __APP_BUILD__;
  const channel =
    { preview: "预览航线", production: "正式航线", local: "本地星图" }[
      build.channel
    ] ?? build.channel;
  return (
    <>
      <button
        className="version-secret"
        aria-label="Questions · 星图"
        onClick={(event) => {
          const now = performance.now();
          taps.current.count =
            now - taps.current.last <= 1500 ? taps.current.count + 1 : 1;
          taps.current.last = now;
          setPulse((value) => value + 1);
          if (taps.current.count === 5) {
            taps.current.count = 0;
            event.currentTarget.focus({ preventScroll: true });
            setOpen(true);
          }
        }}
      >
        <CompassIcon weight="thin" aria-hidden="true" />
        {pulse > 0 && (
          <i key={pulse} className="version-secret__pulse" aria-hidden="true" />
        )}
      </button>
      <AppDialog
        overlayId="version-archive"
        priority={overlayPriority.confirmation}
        open={open}
        onOpenChange={setOpen}
        accessibleTitle="星图档案"
        accessibleDescription="当前页面的版本与构建信息"
        overlayClassName="version-backdrop"
        contentClassName="version-dialog"
      >
        <button
          className="version-close"
          aria-label="关闭星图档案"
          onClick={() => setOpen(false)}
        >
          <XIcon />
        </button>
        <div className="version-orbits" aria-hidden="true">
          <i />
          <i />
          <i />
          <CompassIcon weight="thin" />
        </div>
        <p className="version-eyebrow">QUESTIONS · HIDDEN ARCHIVE</p>
        <h2>星图档案</h2>
        <p className="version-caption">你找到了，故事背后的坐标。</p>
        <div className="version-number">
          <small>{channel}</small>
          <strong>v{build.version}</strong>
        </div>
        <dl className="version-details">
          <div>
            <dt>提交坐标</dt>
            <dd title={build.commit}>{build.commit.slice(0, 12)}</dd>
          </div>
          <div>
            <dt>构建时刻</dt>
            <dd>
              {new Date(build.builtAt).toLocaleString("zh-CN", {
                hour12: false,
              })}
            </dd>
          </div>
        </dl>
        <p className="version-note">
          <StarFourIcon aria-hidden="true" />
          这是当前页面载入的版本
        </p>
      </AppDialog>
    </>
  );
}
