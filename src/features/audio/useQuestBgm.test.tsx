import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BGM_PREFERENCES_KEY } from "@/infrastructure/storage/audio.repository";
import { useQuestBgm } from "@/features/audio/useQuestBgm";

class MockAudio extends EventTarget {
  static instances: MockAudio[] = [];
  static rejectNextPlay = false;
  static legacyPlay = false;
  static throwNextPlay = false;

  readonly src: string;
  loop = false;
  volume = 1;
  preload = "";
  paused = true;
  play = vi.fn((): Promise<void> | void => {
    if (MockAudio.throwNextPlay) {
      MockAudio.throwNextPlay = false;
      throw new DOMException("blocked", "NotAllowedError");
    }
    if (MockAudio.rejectNextPlay) {
      MockAudio.rejectNextPlay = false;
      return Promise.reject(new DOMException("blocked", "NotAllowedError"));
    }
    this.paused = false;
    this.dispatchEvent(new Event("play"));
    if (!MockAudio.legacyPlay) return Promise.resolve();
  });
  pause = vi.fn(() => {
    if (this.paused) return;
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  });

  constructor(src: string) {
    super();
    this.src = src;
    MockAudio.instances.push(this);
  }
}

function Harness({ suspended = false }: { suspended?: boolean }) {
  const bgm = useQuestBgm("https://audio.example/bgm.mp3", suspended);
  return (
    <div>
      <span>{bgm.isPlaying ? "playing" : "paused"}</span>
      {bgm.showAuthHint && <span>authorization needed</span>}
      <button type="button" onClick={bgm.toggle}>
        toggle
      </button>
      <button type="button" onClick={bgm.authorize}>
        authorize
      </button>
    </div>
  );
}

describe("useQuestBgm", () => {
  beforeEach(() => {
    window.localStorage.clear();
    MockAudio.instances = [];
    MockAudio.rejectNextPlay = false;
    MockAudio.legacyPlay = false;
    MockAudio.throwNextPlay = false;
    vi.stubGlobal("Audio", MockAudio);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it.each([false, true])(
    "loops and resumes after video suspension (legacy play: %s)",
    async (legacyPlay) => {
      MockAudio.legacyPlay = legacyPlay;
      const { rerender } = render(<Harness />);
      expect(MockAudio.instances[0].play).toHaveBeenCalledOnce();
      await waitFor(() =>
        expect(screen.getByText("playing")).toBeInTheDocument(),
      );
      const audio = MockAudio.instances[0];
      expect(audio).toMatchObject({
        src: "https://audio.example/bgm.mp3",
        loop: true,
        volume: 0.3,
        preload: "auto",
      });

      rerender(<Harness suspended />);
      expect(screen.getByText("paused")).toBeInTheDocument();
      rerender(<Harness />);
      await waitFor(() =>
        expect(screen.getByText("playing")).toBeInTheDocument(),
      );
      expect(audio.play).toHaveBeenCalledTimes(2);
    },
  );

  it("does not resume after the user explicitly pauses", async () => {
    const { rerender } = render(<Harness />);
    await waitFor(() =>
      expect(screen.getByText("playing")).toBeInTheDocument(),
    );
    const audio = MockAudio.instances[0];

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByText("paused")).toBeInTheDocument();
    expect(window.localStorage.getItem(BGM_PREFERENCES_KEY)).toBe(
      '{"enabled":false}',
    );
    rerender(<Harness suspended />);
    rerender(<Harness />);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it.each(["reject", "throw"])(
    "offers authorization when browser autoplay fails with %s",
    async (failure) => {
      vi.useFakeTimers();
      MockAudio.rejectNextPlay = failure === "reject";
      MockAudio.throwNextPlay = failure === "throw";
      render(<Harness />);
      await act(async () => Promise.resolve());
      expect(screen.getByText("authorization needed")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "authorize" }));
      await act(async () => Promise.resolve());
      expect(screen.getByText("playing")).toBeInTheDocument();
      vi.useRealTimers();
    },
  );
});
