import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { ToastProvider } from "../../components/ui/ToastProvider";
import { BGM_PREFERENCES_KEY } from "../../infrastructure/storage/audio.repository";
import { BgmControls } from "./BgmControls";

function renderControls(element: ReactNode) {
  return render(<ToastProvider>{element}</ToastProvider>);
}

describe("BgmControls", () => {
  beforeEach(() => window.localStorage.clear());

  it("exposes playback and autoplay authorization controls", () => {
    const onToggle = vi.fn();
    const onAuthorize = vi.fn();
    const onDismissAuthHint = vi.fn();
    renderControls(
      <BgmControls
        visible
        isPlaying={false}
        showAuthHint
        onToggle={onToggle}
        onAuthorize={onAuthorize}
        onDismissAuthHint={onDismissAuthHint}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "播放背景音乐" }));
    fireEvent.click(screen.getByRole("button", { name: "开启背景音乐" }));
    fireEvent.click(screen.getByRole("button", { name: "关闭背景音乐提示" }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onAuthorize).toHaveBeenCalledOnce();
    expect(onDismissAuthHint).toHaveBeenCalledTimes(2);
  });

  it("shows an explicit play or pause glyph for the current state", () => {
    const props = {
      visible: true,
      showAuthHint: false,
      onToggle: vi.fn(),
      onAuthorize: vi.fn(),
      onDismissAuthHint: vi.fn(),
    };
    const { container, rerender } = renderControls(
      <BgmControls {...props} isPlaying={false} />,
    );
    expect(container.querySelector(".bgm-play-glyph")).toBeInTheDocument();
    expect(container.querySelector(".bgm-pause-glyph")).toBeNull();

    rerender(
      <ToastProvider>
        <BgmControls {...props} isPlaying />
      </ToastProvider>,
    );
    expect(container.querySelector(".bgm-pause-glyph")).toBeInTheDocument();
    expect(container.querySelector(".bgm-play-glyph")).toBeNull();
  });

  it("renders nothing when the selected quest has no BGM", () => {
    const { container } = renderControls(
      <BgmControls
        visible={false}
        isPlaying={false}
        showAuthHint={false}
        onToggle={vi.fn()}
        onAuthorize={vi.fn()}
        onDismissAuthHint={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "播放背景音乐" }),
    ).not.toBeInTheDocument();
    expect(container.querySelector(".ui-toast")).toBeNull();
  });

  it("drags without toggling playback and persists the floating position", () => {
    const onToggle = vi.fn();
    renderControls(
      <BgmControls
        visible
        isPlaying={false}
        showAuthHint={false}
        onToggle={onToggle}
        onAuthorize={vi.fn()}
        onDismissAuthHint={vi.fn()}
      />,
    );
    const control = screen.getByRole("button", { name: "播放背景音乐" });

    fireEvent.pointerDown(control, {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 980,
      clientY: 740,
    });
    fireEvent.pointerMove(control, {
      pointerId: 1,
      clientX: 220,
      clientY: 180,
    });
    fireEvent.pointerUp(control, {
      pointerId: 1,
      clientX: 220,
      clientY: 180,
    });
    fireEvent.click(control);

    expect(onToggle).not.toHaveBeenCalled();
    const stored = JSON.parse(
      window.localStorage.getItem(BGM_PREFERENCES_KEY) ?? "{}",
    );
    expect(stored.position.x).toBe(0);
    expect(stored.position.y).toBeGreaterThanOrEqual(0);
    expect(stored.position.y).toBeLessThan(1);
  });

  it("supports keyboard positioning without changing playback", () => {
    const onToggle = vi.fn();
    renderControls(
      <BgmControls
        visible
        isPlaying={false}
        showAuthHint={false}
        onToggle={onToggle}
        onAuthorize={vi.fn()}
        onDismissAuthHint={vi.fn()}
      />,
    );
    const control = screen.getByRole("button", { name: "播放背景音乐" });
    fireEvent.keyDown(control, { key: "ArrowLeft", altKey: true });

    expect(onToggle).not.toHaveBeenCalled();
    expect(
      JSON.parse(window.localStorage.getItem(BGM_PREFERENCES_KEY) ?? "{}")
        .position.x,
    ).toBeLessThan(1);
  });
});
