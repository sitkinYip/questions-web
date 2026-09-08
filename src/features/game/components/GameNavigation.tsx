import { useRef, type PointerEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { gameNavigation } from "../game-navigation";

export function GameNavigation({ returnTo }: { returnTo?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const gesture = useRef<{
    id: number;
  } | null>(null);
  const suppressClick = useRef(false);

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
    // Test the actual release position, never the clamped glow or nearest tab.
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
    const target = gameNavigation[index];
    finish(event);
    if (
      window.matchMedia("(max-width: 760px)").matches &&
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
        };
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
