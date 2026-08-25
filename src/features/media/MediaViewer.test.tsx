import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MediaViewer } from "./MediaViewer";

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
    const { container } = render(
      <MediaViewer
        state={{ type: "video", url: "https://video.example/movie.mp4" }}
        onClose={vi.fn()}
        onImageIndexChange={vi.fn()}
        onVideoPlayingChange={onVideoPlayingChange}
      />,
    );
    const video = container.ownerDocument.querySelector("video");
    expect(video).not.toBeNull();
    fireEvent.play(video!);
    fireEvent.pause(video!);
    fireEvent.ended(video!);
    expect(onVideoPlayingChange.mock.calls).toEqual([[true], [false], [false]]);
  });
});
