import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installDevViewportScaleRecovery } from "@/shared/layout/devViewportRecovery";
import { DESKTOP_LAYOUT_QUERY } from "@/shared/layout/useDesktopLayout";

interface MockEnv {
  win: Window;
  setMetrics: (next: {
    desktop?: boolean;
    coarse?: boolean;
    width?: number;
    dpr?: number;
    scale?: number;
  }) => void;
  fireDesktopChange: () => void;
  fireCoarseChange: () => void;
  fireWinResize: () => void;
  fireVvResize: () => void;
}

function createMockEnv(initial?: {
  desktop?: boolean;
  coarse?: boolean;
  width?: number;
  dpr?: number;
  scale?: number;
}): MockEnv {
  let desktop = initial?.desktop ?? true;
  let coarse = initial?.coarse ?? false;
  let width = initial?.width ?? 1440;
  let dpr = initial?.dpr ?? 2;
  let scale = initial?.scale ?? 1;

  const desktopListeners = new Set<() => void>();
  const coarseListeners = new Set<() => void>();
  const winResizeListeners = new Set<() => void>();
  const vvResizeListeners = new Set<() => void>();
  const store = new Map<string, string>();

  const makeMedia = (getMatches: () => boolean, set: Set<() => void>) => ({
    get matches() {
      return getMatches();
    },
    addEventListener: (_e: string, fn: () => void) => set.add(fn),
    removeEventListener: (_e: string, fn: () => void) => set.delete(fn),
  });

  const win = {
    get innerWidth() {
      return width;
    },
    get devicePixelRatio() {
      return dpr;
    },
    document,
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => {
        store.set(key, val);
      },
    },
    matchMedia: (query: string) =>
      query === DESKTOP_LAYOUT_QUERY
        ? makeMedia(() => desktop, desktopListeners)
        : makeMedia(() => coarse, coarseListeners),
    addEventListener: (ev: string, fn: () => void) => {
      if (ev === "resize") winResizeListeners.add(fn);
    },
    removeEventListener: (ev: string, fn: () => void) => {
      if (ev === "resize") winResizeListeners.delete(fn);
    },
    visualViewport: {
      get scale() {
        return scale;
      },
      addEventListener: (ev: string, fn: () => void) => {
        if (ev === "resize") vvResizeListeners.add(fn);
      },
      removeEventListener: (ev: string, fn: () => void) => {
        if (ev === "resize") vvResizeListeners.delete(fn);
      },
    },
    requestAnimationFrame: (cb: FrameRequestCallback) =>
      window.setTimeout(() => cb(performance.now()), 16),
    cancelAnimationFrame: (id: number) => window.clearTimeout(id),
    setTimeout: window.setTimeout.bind(window),
    clearTimeout: window.clearTimeout.bind(window),
  } as unknown as Window;

  return {
    win,
    setMetrics: (next) => {
      if (next.desktop !== undefined) desktop = next.desktop;
      if (next.coarse !== undefined) coarse = next.coarse;
      if (next.width !== undefined) width = next.width;
      if (next.dpr !== undefined) dpr = next.dpr;
      if (next.scale !== undefined) scale = next.scale;
    },
    fireDesktopChange: () => desktopListeners.forEach((fn) => fn()),
    fireCoarseChange: () => coarseListeners.forEach((fn) => fn()),
    fireWinResize: () => winResizeListeners.forEach((fn) => fn()),
    fireVvResize: () => vvResizeListeners.forEach((fn) => fn()),
  };
}

describe("installDevViewportScaleRecovery", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("PC 切移动端且 visualViewport.scale 卡在 80/77 时自动刷新一次", () => {
    const env = createMockEnv({ desktop: true, width: 1440, dpr: 2, scale: 1 });
    let clock = 10_000;
    const reload = vi.fn();
    const dispose = installDevViewportScaleRecovery({
      win: env.win,
      now: () => clock,
      reload,
    });

    env.setMetrics({
      desktop: false,
      coarse: true,
      width: 440,
      dpr: 3,
      scale: 80 / 77,
    });
    env.fireDesktopChange();
    expect(reload).toHaveBeenCalledTimes(1);

    // 同一实例内后续事件不重复刷新
    env.fireVvResize();
    vi.advanceTimersByTime(500);
    expect(reload).toHaveBeenCalledTimes(1);

    // 冷却期内即使重新安装也不死循环刷新
    dispose();
    const env2Reload = vi.fn();
    clock += 500;
    const dispose2 = installDevViewportScaleRecovery({
      win: env.win,
      now: () => clock,
      reload: env2Reload,
    });
    env.setMetrics({ desktop: true, width: 1440, scale: 1 });
    env.fireDesktopChange();
    env.setMetrics({ desktop: false, width: 440, scale: 80 / 77 });
    env.fireDesktopChange();
    expect(env2Reload).toHaveBeenCalledTimes(0);
    dispose2();
  });

  it("桌面窗口已窄于 1100px 但开启触控仿真后延迟出现异常缩放时仍会触发兜底", () => {
    const env = createMockEnv({
      desktop: false,
      coarse: false,
      width: 980,
      dpr: 2,
      scale: 1,
    });
    let clock = 20_000;
    const reload = vi.fn();
    const dispose = installDevViewportScaleRecovery({
      win: env.win,
      now: () => clock,
      reload,
    });

    env.setMetrics({ coarse: true, width: 440, dpr: 3, scale: 1 });
    env.fireCoarseChange();
    expect(reload).toHaveBeenCalledTimes(0);

    // 100ms 后 Blink 上报异常 scale
    clock += 100;
    env.setMetrics({ scale: 1.038961 });
    env.fireVvResize();
    expect(reload).toHaveBeenCalledTimes(1);
    dispose();
  });

  it("正常切换（scale=1）或移动端事后手动双指缩放不触发刷新", () => {
    const env = createMockEnv({ desktop: true, width: 1440, scale: 1 });
    let clock = 30_000;
    const reload = vi.fn();
    const dispose = installDevViewportScaleRecovery({
      win: env.win,
      now: () => clock,
      reload,
    });

    env.setMetrics({ desktop: false, coarse: true, width: 440, scale: 1 });
    env.fireDesktopChange();
    vi.advanceTimersByTime(1000);
    expect(reload).toHaveBeenCalledTimes(0);

    // 超过 600ms 检测窗口后，用户主动双指放大不应刷新页面
    clock += 2000;
    env.setMetrics({ scale: 1.5 });
    env.fireVvResize();
    expect(reload).toHaveBeenCalledTimes(0);
    dispose();
  });

  it("正在输入表单字段时不自动刷新丢失输入", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const env = createMockEnv({ desktop: true, width: 1440, scale: 1 });
    const reload = vi.fn();
    const dispose = installDevViewportScaleRecovery({
      win: env.win,
      now: () => 40_000,
      reload,
    });

    env.setMetrics({
      desktop: false,
      coarse: true,
      width: 440,
      scale: 80 / 77,
    });
    env.fireDesktopChange();
    expect(reload).toHaveBeenCalledTimes(0);
    dispose();
  });
});
