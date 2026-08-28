import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet } from "../../components/ui/Sheet";
import { Button } from "../../components/ui/Button";
import { overlayPriority } from "../../components/ui/overlay-context";
import { useTheme } from "../../components/ui/theme-context";
import { useGame } from "./useGame";

export function GameSidebar() {
  const { player, avatarUrl, logout } = useGame();
  const theme = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const returnTo =
    location.pathname.match(/^\/play\/[^/]+/)?.[0] ||
    (typeof location.state?.returnTo === "string" &&
    /^\/play\/[^/]+$/.test(location.state.returnTo)
      ? location.state.returnTo
      : undefined);
  const progress = player.nextLevel
    ? Math.min(
        100,
        Math.max(
          0,
          ((player.totalXp - player.level.minTotalXp) /
            (player.nextLevel.minTotalXp - player.level.minTotalXp)) *
            100,
        ),
      )
    : 100;
  return (
    <>
      <button
        className="theme-avatar-trigger"
        type="button"
        aria-label="打开冒险者菜单"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="冒险者菜单"
        onClick={(event) => {
          // Touch Safari doesn't focus buttons on click. Capture the trigger as
          // the dialog's return target without moving the underlying question.
          event.currentTarget.focus({ preventScroll: true });
          setOpen(true);
        }}
      >
        {avatarUrl ? (
          <img
            className="traveler-avatar"
            src={avatarUrl}
            alt={`${player.displayName}的头像`}
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <span className="traveler-avatar traveler-avatar--fallback">
            {Array.from(player.displayName.trim() || "旅")[0]}
          </span>
        )}
        <span className="theme-avatar-indicator" aria-hidden="true" />
      </button>
      <Sheet
        overlayId="game-sidebar"
        priority={overlayPriority.confirmation}
        open={open}
        onOpenChange={setOpen}
        title="冒险者菜单"
        side="left"
      >
        <div className="game-sidebar__content">
          <section className="game-sidebar__identity" aria-label="用户信息">
            <h2>{player.displayName}</h2>
            <p className="traveler-rank">
              RANK {player.level.order} · {player.level.name}
            </p>
            <p className="game-muted">账号：{player.account}</p>
            <div className="game-xp">
              <span>{player.totalXp} EXP</span>
              <progress value={progress} max={100} aria-label="等级经验进度" />
              <span>
                {player.nextLevel
                  ? `距离 ${player.nextLevel.name} 还需 ${Math.max(0, player.nextLevel.minTotalXp - player.totalXp)} 经验`
                  : "已达到当前最高等级"}
              </span>
            </div>
          </section>
          <fieldset className="game-sidebar__theme">
            <legend>界面主题</legend>
            {(
              [
                { value: "system", label: "跟随系统" },
                { value: "light", label: "浅色" },
                { value: "dark", label: "深色" },
              ] as const
            ).map((option) => (
              <label key={option.value}>
                <input
                  type="radio"
                  name="game-theme"
                  value={option.value}
                  checked={theme.preference === option.value}
                  onChange={() => theme.setPreference(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          <nav className="game-sidebar__nav" aria-label="个人导航">
            {[
              ...(returnTo ? [[returnTo, "返回答题"]] : []),
              ["/", "我的场次"],
              ["/profile", "个人资料"],
              ["/rewards", "奖品"],
              ["/notifications", "通知"],
            ].map(([to, label]) => (
              <Link
                key={to}
                to={to}
                state={{ returnTo }}
                aria-current={location.pathname === to ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>

          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            退出登录
          </Button>
        </div>
      </Sheet>
    </>
  );
}
