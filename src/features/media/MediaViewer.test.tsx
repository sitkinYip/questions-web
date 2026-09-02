import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MediaViewer } from "./MediaViewer";

afterEach(() => vi.restoreAllMocks());

describe("MediaViewer", () => {
  it("navigates an image gallery and closes with Escape", () => {
    const onClose = vi.fn();
    const onImageIndexChange = vi.fn();
    render(
      <MediaViewer
        state={{
          type: "images",
          urls: ["https://img.example/1.jpg", "https://img.example/2.jpg"],
          index: 0,
        }}
        onClose={onClose}
        onImageIndexChange={onImageIndexChange}
        onVideoPlayingChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "下一张" }));
    expect(onImageIndexChange).toHaveBeenCalledWith(1);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("reports video play, pause and ended states", () => {
    const onVideoPlayingChange = vi.fn();
    render(
      <MediaViewer
        state={{ type: "video", url: "https://video.example/movie.mp4" }}
        onClose={vi.fn()}
        onImageIndexChange={vi.fn()}
        onVideoPlayingChange={onVideoPlayingChange}
      />,
    );
    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    fireEvent.play(video!);
    fireEvent.pause(video!);
    fireEvent.ended(video!);
    expect(onVideoPlayingChange.mock.calls).toEqual([[true], [false], [false]]);
  });

  it("keeps Quark sound controls outside the video frame and preserves events", () => {
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Quark/7.0");
    const onVideoPlayingChange = vi.fn();
    const onVideoEnded = vi.fn();
    render(
      <MediaViewer
        state={{ type: "video", url: "https://video.example/movie.mp4" }}
        onClose={vi.fn()}
        onImageIndexChange={vi.fn()}
        onVideoPlayingChange={onVideoPlayingChange}
        onVideoEnded={onVideoEnded}
      />,
    );
    const video = document.querySelector("video")!;
    expect(video.muted).toBe(true);
    expect(video.autoplay).toBe(true);
    fireEvent.play(video);
    const soundButton = screen.getByRole("button", { name: "开启声音" });
    expect(soundButton.closest(".media-viewer-stage")).toBeNull();
    fireEvent.click(soundButton);
    expect(video.muted).toBe(false);
    fireEvent.pause(video);
    fireEvent.ended(video);
    expect(onVideoPlayingChange.mock.calls).toEqual([[true], [false], [false]]);
    expect(onVideoEnded).toHaveBeenCalledOnce();
  });

  it("navigates with deliberate horizontal touch swipes", () => {
    const onImageIndexChange = vi.fn();
    render(
      <MediaViewer
        state={{
          type: "images",
          urls: [
            "https://img.example/1.jpg",
            "https://img.example/2.jpg",
            "https://img.example/3.jpg",
          ],
          index: 1,
        }}
        onClose={vi.fn()}
        onImageIndexChange={onImageIndexChange}
        onVideoPlayingChange={vi.fn()}
      />,
    );
    const stage = document.querySelector<HTMLElement>(".media-viewer-stage");
    expect(stage).not.toBeNull();

    fireEvent.pointerDown(stage!, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 240,
      clientY: 100,
    });
    fireEvent.pointerUp(stage!, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 120,
      clientY: 108,
    });
    fireEvent.pointerDown(stage!, {
      pointerId: 2,
      pointerType: "touch",
      isPrimary: true,
      clientX: 120,
      clientY: 100,
    });
    fireEvent.pointerUp(stage!, {
      pointerId: 2,
      pointerType: "touch",
      isPrimary: true,
      clientX: 240,
      clientY: 108,
    });
    fireEvent.pointerDown(stage!, {
      pointerId: 3,
      pointerType: "touch",
      isPrimary: true,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerUp(stage!, {
      pointerId: 3,
      pointerType: "touch",
      isPrimary: true,
      clientX: 130,
      clientY: 220,
    });

    expect(onImageIndexChange.mock.calls).toEqual([[2], [0]]);
  });
});
