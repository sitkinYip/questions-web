import { useRef, type PointerEvent } from "react";
import {
  CompassIcon,
  EnvelopeSimpleIcon,
  IdentificationCardIcon,
  SparkleIcon,
} from "@phosphor-icons/react";

export type TabKey = "lobby" | "rewards" | "mailbox" | "passport";

const TABS: ReadonlyArray<{
  key: TabKey;
  label: string;
  Icon: typeof CompassIcon;
}> = [
  { key: "lobby", label: "启程", Icon: CompassIcon },
  { key: "rewards", label: "收藏", Icon: SparkleIcon },
  { key: "mailbox", label: "来信", Icon: EnvelopeSimpleIcon },
  { key: "passport", label: "护照", Icon: IdentificationCardIcon },
];

export interface FloatingTabBarProps {
  active: TabKey;
  unreadCount?: number;
  onSelect: (tab: TabKey) => void;
}

/**
 * 悬浮玻璃胶囊底栏
 * 完整保留现有移动端底栏的鸿蒙沉浸光感滑动追踪机制（--touch-x/--touch-y + data-tracking），
 * 视觉配色升级为 Logo 冰蓝体系，选中态 regular -> fill 图标 + 柔和星辉。
 */
export function FloatingTabBar({
  active,
  unreadCount = 0,
  onSelect,
}: FloatingTabBarProps) {
  const gestureId = useRef<number | null>(null);
  const suppressClick = useRef(false);

  function track(event: PointerEvent<HTMLElement>) {
    if (gestureId.current !== event.pointerId) return;
    const nav = event.currentTarget;
    const rect = nav.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      nav.removeAttribute("data-tracking");
      return;
    }
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(8, Math.min(rect.height - 8, event.clientY - rect.top));
    nav.style.setProperty("--touch-x", `${x}px`);
    nav.style.setProperty("--touch-y", `${y}px`);
    nav.setAttribute("data-tracking", "true");
  }

  function finish(event: PointerEvent<HTMLElement>) {
    if (gestureId.current !== event.pointerId) return;
    gestureId.current = null;
    event.currentTarget.removeAttribute("data-tracking");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function release(event: PointerEvent<HTMLElement>) {
    if (gestureId.current !== event.pointerId) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll("button"));
    const index = buttons.findIndex((el) => {
      const box = el.getBoundingClientRect();
      return (
        event.clientX >= box.left &&
        event.clientX <= box.right &&
        event.clientY >= box.top &&
        event.clientY <= box.bottom
      );
    });
    finish(event);
    const target = TABS[index];
    if (target && target.key !== active) {
      onSelect(target.key);
    }
  }

  return (
    <nav
      className="sw-tabbar"
      aria-label="主导航"
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={(event) => {
        if (gestureId.current === null) suppressClick.current = false;
        if (
          !event.isPrimary ||
          event.button !== 0 ||
          gestureId.current !== null
        )
          return;
        suppressClick.current = true;
        gestureId.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        track(event);
      }}
      onPointerMove={track}
      onPointerUp={release}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
      onClickCapture={(event) => {
        if (event.detail > 0 && suppressClick.current) {
          event.preventDefault();
          suppressClick.current = false;
        }
      }}
    >
      {TABS.map(({ key, label, Icon }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            type="button"
            className="sw-tabbar__item"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onSelect(key)}
          >
            <span className="sw-tabbar__icon" aria-hidden="true">
              <Icon size={22} weight={isActive ? "fill" : "regular"} />
              {key === "mailbox" && unreadCount > 0 && (
                <span className="sw-tabbar__dot" />
              )}
            </span>
            <span className="sw-tabbar__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
