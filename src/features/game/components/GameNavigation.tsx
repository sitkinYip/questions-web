import { uiCopy } from "@/config/ui-copy";
import { useRef, type PointerEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { gameNavigation } from "@/features/game/game-navigation";
import {
  useAssignments,
  useGameNotifications,
  useRewards,
} from "@/features/game/game-queries";
import {
  unreadAssignments,
  unreadRewards,
  useGameSeenActivity,
} from "@/features/game/game-unread";

function isFloatingTabBarViewport() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 1099px)").matches
  );
}

export function GameNavigation({
  returnTo,
  desktopInline = false,
}: {
  returnTo?: string;
  desktopInline?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const notifications = useGameNotifications();
  const assignments = useAssignments(false);
  const rewards = useRewards(false);
  const seen = useGameSeenActivity();
  const badges = {
    "/": {
      count: unreadAssignments(assignments.data?.items, seen).size,
      describe: uiCopy.gameUnread.assignments,
    },
    "/rewards": {
      count: unreadRewards(rewards.data?.items, seen).size,
      describe: uiCopy.gameUnread.rewards,
    },
    "/notifications": {
      count:
        notifications.data?.items.filter((note) => !note.readAt).length ?? 0,
      describe: uiCopy.gameNotificationCenter.unreadSummary,
    },
    "/profile": null,
  };
  const gesture = useRef<{
    id: number;
  } | null>(null);
  const suppressClick = useRef(false);

  const items = desktopInline
    ? gameNavigation.filter((item) => item.to !== "/profile")
    : gameNavigation;

  function track(event: PointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
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

  function release(event: PointerEvent<HTMLElement>) {
    if (gesture.current?.id !== event.pointerId) return;
    // 以实际松手落点判定目标项，不按光斑边界吸附
    const link = Array.from(event.currentTarget.querySelectorAll("a")).find(
      (element) => {
        const box = element.getBoundingClientRect();
        const center = box.left + box.width / 2;
        const halfWidth = Math.min(48, box.width) / 2;
        return (
          event.clientX >= center - halfWidth &&
          event.clientX <= center + halfWidth &&
          event.clientY >= box.top &&
          event.clientY <= box.bottom
        );
      },
    );
    const index = link
      ? Array.from(event.currentTarget.querySelectorAll("a")).indexOf(link)
      : -1;
    const target = items[index];
    finish(event);
    if (
      !desktopInline &&
      isFloatingTabBarViewport() &&
      target &&
      target.to !== location.pathname
    ) {
      void navigate(target.to, { state: { returnTo } });
    }
  }

  function finish(event: PointerEvent<HTMLElement>) {
    if (gesture.current?.id !== event.pointerId) return;
    gesture.current = null;
    event.currentTarget.removeAttribute("data-tracking");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <nav
      className={`game-navigation${desktopInline ? " game-navigation--desktop" : ""}`}
      aria-label={uiCopy.gameNavigationControl.label}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (desktopInline) return;
        if (!gesture.current) suppressClick.current = false;
        if (
          !isFloatingTabBarViewport() ||
          !event.isPrimary ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          gesture.current
        )
          return;
        suppressClick.current = true;
        gesture.current = {
          id: event.pointerId,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        track(event);
      }}
      onPointerMove={desktopInline ? undefined : track}
      onPointerUp={desktopInline ? undefined : release}
      onPointerCancel={desktopInline ? undefined : finish}
      onLostPointerCapture={desktopInline ? undefined : finish}
      onClickCapture={(event) => {
        if (!desktopInline && event.detail > 0 && suppressClick.current) {
          event.preventDefault();
          suppressClick.current = false;
        }
      }}
    >
      {items.map(({ to, label, Icon }) => {
        const badge = badges[to];
        const unread = badge?.count ?? 0;
        return (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            state={{ returnTo }}
            aria-description={
              badge && unread > 0 ? badge.describe(unread) : undefined
            }
          >
            {({ isActive }) =>
              desktopInline ? (
                <>
                  <span>{label}</span>
                  {unread > 0 && (
                    <span className="game-navigation__dot" aria-hidden="true" />
                  )}
                </>
              ) : (
                <>
                  <span className="game-navigation__icon" aria-hidden="true">
                    <Icon weight={isActive ? "fill" : "regular"} />
                    {unread > 0 && (
                      <span className="game-navigation__unread">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </span>
                  <span>{label}</span>
                </>
              )
            }
          </NavLink>
        );
      })}
    </nav>
  );
}
