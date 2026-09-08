import { uiCopy } from "@/config/ui-copy";
import { useRef, useState } from "react";
import { CompassIcon, StarFourIcon, XIcon } from "@phosphor-icons/react";
import { AppDialog } from "@/components/ui/Dialog";
import { overlayPriority } from "@/components/ui/overlay-context";

export function VersionSecret() {
  const taps = useRef({ count: 0, last: 0 });
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const build = __APP_BUILD__;
  const channel =
    {
      preview: uiCopy.versionSecret.preview,
      production: uiCopy.versionSecret.production,
      local: uiCopy.versionSecret.local,
    }[build.channel] ?? build.channel;
  return (
    <>
      <button
        className="version-secret"
        aria-label={uiCopy.versionSecret.label}
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
        accessibleTitle={uiCopy.versionSecret.title}
        accessibleDescription={uiCopy.versionSecret.description}
        overlayClassName="version-backdrop"
        contentClassName="version-dialog"
      >
        <button
          className="version-close"
          aria-label={uiCopy.versionSecret.close}
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
        <p className="version-eyebrow">{uiCopy.versionSecret.eyebrow}</p>
        <h2>{uiCopy.versionSecret.title}</h2>
        <p className="version-caption">{uiCopy.versionSecret.caption}</p>
        <div className="version-number">
          <small>{channel}</small>
          <strong>{uiCopy.versionSecret.version(build.version)}</strong>
        </div>
        <dl className="version-details">
          <div>
            <dt>{uiCopy.versionSecret.commit}</dt>
            <dd title={build.commit}>{build.commit.slice(0, 12)}</dd>
          </div>
          <div>
            <dt>{uiCopy.versionSecret.builtAt}</dt>
            <dd>
              {new Date(build.builtAt).toLocaleString("zh-CN", {
                hour12: false,
              })}
            </dd>
          </div>
        </dl>
        <p className="version-note">
          <StarFourIcon aria-hidden="true" />
          {uiCopy.versionSecret.footer}
        </p>
      </AppDialog>
    </>
  );
}
