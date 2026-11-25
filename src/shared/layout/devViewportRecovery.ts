import { DESKTOP_LAYOUT_QUERY } from "@/shared/layout/useDesktopLayout";

const COARSE_POINTER_QUERY = "(pointer: coarse)";
const RELOAD_STAMP_KEY = "starward:dev:vp-scale-reload-at";
const SCALE_THRESHOLD = 1.005;
const ARMED_WINDOW_MS = 600;
const RELOAD_COOLDOWN_MS = 2500;
const WIDTH_DROP_THRESHOLD = 120;
const CHECK_DELAYS_MS = [120, 320];

export interface DevViewportRecoveryOptions {
  win?: Window;
  now?: () => number;
  reload?: () => void;
}

function isEditingField(doc: Document): boolean {
  const active = doc.activeElement;
  return (
    active instanceof HTMLElement &&
    (active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      active.tagName === "SELECT" ||
      active.isContentEditable)
  );
}

function canReloadNow(win: Window, now: () => number): boolean {
  try {
    const raw = win.sessionStorage?.getItem(RELOAD_STAMP_KEY);
    if (!raw) return true;
    const last = Number(raw);
    return !Number.isFinite(last) || now() - last >= RELOAD_COOLDOWN_MS;
  } catch {
    return true;
  }
}

function markReloaded(win: Window, now: () => number): void {
  try {
    win.sessionStorage?.setItem(RELOAD_STAMP_KEY, String(now()));
  } catch {
    // 隐私模式或禁存储环境忽略写入失败
  }
}

/**
 * 仅开发环境启用：Chrome DevTools 从 PC 热切至移动端仿真且未刷新文档时，
 * Blink 可能残留 visualViewport.scale > 1（例如 80/77 ≈ 1.039）导致底栏半截裁切。
 * 在检测到 PC -> 移动端切换瞬间出现异常缩放时自动执行一次整页刷新以重置 pageScaleFactor。
 */
export function installDevViewportScaleRecovery(
  options: DevViewportRecoveryOptions = {},
): () => void {
  const win = options.win ?? (typeof window !== "undefined" ? window : null);
  if (!win) return () => {};

  const now = options.now ?? (() => Date.now());
  const reload = options.reload ?? (() => win.location.reload());
  const desktopMedia = win.matchMedia?.(DESKTOP_LAYOUT_QUERY);
  const coarseMedia = win.matchMedia?.(COARSE_POINTER_QUERY);

  let wasDesktop = desktopMedia?.matches ?? win.innerWidth >= 1100;
  let wasCoarse = coarseMedia?.matches ?? false;
  let lastWidth = win.innerWidth;
  let lastDpr = win.devicePixelRatio || 1;
  let armedUntil = 0;
  let rafId = 0;
  let triggered = false;
  const timers = new Set<number>();

  const clearTimers = () => {
    if (rafId) {
      win.cancelAnimationFrame?.(rafId);
      rafId = 0;
    }
    for (const id of timers) {
      win.clearTimeout(id);
    }
    timers.clear();
  };

  const inspect = () => {
    if (triggered || now() > armedUntil) return;
    const vv = win.visualViewport;
    if (!vv || vv.scale <= SCALE_THRESHOLD) return;
    if (isEditingField(win.document)) return;
    if (!canReloadNow(win, now)) return;
    triggered = true;
    clearTimers();
    markReloaded(win, now);
    reload();
  };

  const armRecoveryWindow = () => {
    armedUntil = now() + ARMED_WINDOW_MS;
    inspect();
    if (triggered) return;
    if (typeof win.requestAnimationFrame === "function") {
      if (rafId) win.cancelAnimationFrame?.(rafId);
      rafId = win.requestAnimationFrame(() => {
        rafId = 0;
        inspect();
      });
    }
    for (const delay of CHECK_DELAYS_MS) {
      const id = win.setTimeout(() => {
        timers.delete(id);
        inspect();
      }, delay);
      timers.add(id);
    }
  };

  const handleTransition = () => {
    const isDesktop = desktopMedia?.matches ?? win.innerWidth >= 1100;
    const isCoarse = coarseMedia?.matches ?? false;
    const width = win.innerWidth;
    const dpr = win.devicePixelRatio || 1;

    const switchedDesktopToMobile = wasDesktop && !isDesktop;
    const enabledTouchEmulation = !wasCoarse && isCoarse;
    const shrankIntoMobile =
      lastWidth - width >= WIDTH_DROP_THRESHOLD && width < 1100;
    const changedMobileDpr = dpr !== lastDpr && width < 1100;

    wasDesktop = isDesktop;
    wasCoarse = isCoarse;
    lastWidth = width;
    lastDpr = dpr;

    if (
      switchedDesktopToMobile ||
      enabledTouchEmulation ||
      shrankIntoMobile ||
      changedMobileDpr
    ) {
      armRecoveryWindow();
    } else {
      inspect();
    }
  };

  desktopMedia?.addEventListener("change", handleTransition);
  coarseMedia?.addEventListener("change", handleTransition);
  win.addEventListener("resize", handleTransition);
  win.visualViewport?.addEventListener("resize", inspect);

  return () => {
    clearTimers();
    desktopMedia?.removeEventListener("change", handleTransition);
    coarseMedia?.removeEventListener("change", handleTransition);
    win.removeEventListener("resize", handleTransition);
    win.visualViewport?.removeEventListener("resize", inspect);
  };
}
