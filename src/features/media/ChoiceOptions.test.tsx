import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChoiceOptions } from "@/features/media/ChoiceOptions";

describe("ChoiceOptions", () => {
  it("opens option media without selecting the answer", () => {
    const onChange = vi.fn();
    const onOpenVideo = vi.fn();
    render(
      <ChoiceOptions
        questId="quest"
        options={[
          {
            key: "A",
            text: "影像选项",
            imageUrl: "https://img.example/poster.jpg",
            videoUrl: "https://video.example/movie.mp4",
          },
        ]}
        value=""
        disabled={false}
        onChange={onChange}
        onOpenImage={vi.fn()}
        onOpenVideo={onOpenVideo}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "播放选项 A 视频" }));
    expect(onOpenVideo).toHaveBeenCalledWith(
      "https://video.example/movie.mp4",
      "https://img.example/poster.jpg",
    );
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("影像选项"));
    expect(onChange).toHaveBeenCalledWith("A");
  });
});
