import { memo } from "react";
import { StarFourIcon } from "@phosphor-icons/react";

/** Decorative geometry, never business state. CSS owns motion and reduced motion. */
export const CelestialAtlas = memo(function CelestialAtlas({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div
      className={`celestial-atlas${compact ? " celestial-atlas--compact" : ""}`}
      aria-hidden="true"
    >
      <div className="celestial-atlas__orbit celestial-atlas__orbit--outer">
        <i />
        <i />
        <i />
      </div>
      <div className="celestial-atlas__orbit celestial-atlas__orbit--middle">
        <i />
        <i />
      </div>
      <div className="celestial-atlas__orbit celestial-atlas__orbit--inner">
        <i />
      </div>
      <div className="celestial-atlas__axis" />
      <div className="celestial-atlas__star">
        <StarFourIcon weight="thin" />
      </div>
      <span className="celestial-atlas__north">N</span>
      <span className="celestial-atlas__south">S</span>
    </div>
  );
});
