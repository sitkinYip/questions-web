import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NativeVideo } from "./NativeVideo";

afterEach(() => vi.restoreAllMocks());

function mockBrowser(userAgent: string) {
  vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(userAgent);
}

describe("NativeVideo", () => {
  it.each(["Quark/7.0", "UCBrowser/17.0", "UCWEB/2.0", "ucturbo/1.0"])(
    "starts muted in %s and unmutes from a user gesture",
    (browser) => {
      mockBrowser(`Mozilla/5.0 (Linux; Android 14) Mobile ${browser}`);
      const { container } = render(
        <NativeVideo src="/movie.mp4" controls autoPlay />,
      );
      const video = container.querySelector("video")!;

      expect(video.muted).toBe(true);
      expect(video.defaultMuted).toBe(true);
      expect(video.playsInline).toBe(true);
      // No sound button in unplayed/hidden rich-content previews.
      expect(screen.queryByRole("button")).not.toBeInTheDocument();

      fireEvent.play(video);
      fireEvent.click(screen.getByRole("button", { name: "开启声音" }));
      expect(video.muted).toBe(false);
      expect(screen.getByText("声音已开启")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "静音" }));
      expect(video.muted).toBe(true);
    },
  );

  it.each([
    "Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone) Version/18.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14) Mobile MicroMessenger/8.0",
  ])("preserves native playback for other browsers: %s", (userAgent) => {
    mockBrowser(userAgent);
    const { container } = render(
      <NativeVideo src="/movie.mp4" controls preload="metadata" />,
    );
    const video = container.querySelector("video")!;

    expect(video.muted).toBe(false);
    expect(video.defaultMuted).toBe(false);
    expect(video.playsInline).toBe(false);
    expect(video.autoplay).toBe(false);
    expect(video.controls).toBe(true);
    expect(video.preload).toBe("metadata");
    fireEvent.play(video);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.children).toHaveLength(1);
  });

  it("tracks native mute controls and keeps the caller's events", () => {
    mockBrowser("Quark/7.0");
    const onPlay = vi.fn();
    const onVolumeChange = vi.fn();
    const { container } = render(
      <NativeVideo
        src="/movie.mp4"
        controls
        onPlay={onPlay}
        onVolumeChange={onVolumeChange}
      />,
    );
    const video = container.querySelector("video")!;
    fireEvent.play(video);
    video.muted = false;
    const volumeChange = new Event("volumechange");
    fireEvent(video, volumeChange);
    expect(screen.getByRole("button", { name: "静音" })).toBeInTheDocument();
    expect(onPlay).toHaveBeenCalledOnce();
    expect(onVolumeChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ nativeEvent: volumeChange }),
    );

    video.muted = true;
    fireEvent.volumeChange(video);
    expect(
      screen.getByRole("button", { name: "开启声音" }),
    ).toBeInTheDocument();
  });

  it("keeps sound on during rerenders but starts each new video muted", () => {
    mockBrowser("Quark/7.0");
    const { container, rerender } = render(<NativeVideo src="/one.mp4" />);
    fireEvent.play(container.querySelector("video")!);
    fireEvent.click(screen.getByRole("button", { name: "开启声音" }));

    rerender(<NativeVideo src="/one.mp4" poster="/poster.jpg" />);
    expect(container.querySelector("video")!.muted).toBe(false);

    rerender(<NativeVideo src="/two.mp4" />);
    expect(container.querySelector("video")!.muted).toBe(true);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    fireEvent.play(container.querySelector("video")!);
    fireEvent.click(screen.getByRole("button", { name: "开启声音" }));
    rerender(<></>);
    rerender(<NativeVideo src="/two.mp4" />);
    expect(container.querySelector("video")!.muted).toBe(true);
  });
});
