import { useRef, type PointerEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { gameNavigation } from "../game-navigation";

export function GameNavigation({ returnTo }: { returnTo?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const gesture = useRef<{
    id: number;
    path: string;
    navigated: boolean;
    index: number;
  } | null>(null);
  const suppressClick = useRef(false);

  function track(event: PointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    const nav = event.currentTarget;
    const rect = nav.getBoundingClientRect();
    // A vertical escape pauses selection; horizontal overshoot stays at an end tab.
    if (event.clientY < rect.top - 12 || event.clientY > rect.bottom + 12) {
      nav.removeAttribute("data-tracking");
      return;
    }
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(8, Math.min(rect.height - 8, event.clientY - rect.top));
    nav.style.setProperty("--touch-x", `${x}px`);
    nav.style.setProperty("--touch-y", `${y}px`);
    nav.setAttribute("data-tracking", "true");
    const links = Array.from(nav.querySelectorAll("a"));
    const centers = links.map((link) => {
      const box = link.getBoundingClientRect();
      return box.left + box.width / 2;
    });
    let index = centers.reduce(
      (best, center, i) =>
        Math.abs(center - event.clientX) <
        Math.abs(centers[best]! - event.clientX)
          ? i
          : best,
      0,
    );
    // Small hysteresis prevents flicker when a finger rests between two tabs.
    if (current.index >= 0 && index !== current.index) {
      const boundary = (centers[index]! + centers[current.index]!) / 2;
      if (Math.abs(event.clientX - boundary) < 5) index = current.index;
    }
    current.index = index;
    const path = gameNavigation[index]!.to;
    if (path !== current.path) {
      current.path = path;
      void navigate(path, { state: { returnTo }, replace: current.navigated });
      current.navigated = true;
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
      className="game-navigation"
      aria-label="冒险导航"
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (!gesture.current) suppressClick.current = false;
        if (
          !window.matchMedia("(max-width: 760px)").matches ||
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
          path: location.pathname,
          navigated: false,
          index: -1,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        track(event);
      }}
      onPointerMove={track}
      onPointerUp={(event) => {
        track(event);
        finish(event);
      }}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
      onClickCapture={(event) => {
        if (event.detail > 0 && suppressClick.current) {
          event.preventDefault();
          suppressClick.current = false;
        }
      }}
    >
      {gameNavigation.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} end={to === "/"} state={{ returnTo }}>
          {({ isActive }) => (
            <>
              <Icon weight={isActive ? "fill" : "regular"} aria-hidden="true" />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
