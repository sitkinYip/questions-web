import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { QuestContent } from "@/features/media/QuestContent";

describe("QuestContent", () => {
  it("keeps content order and opens image galleries at the selected image", () => {
    const onOpenImages = vi.fn();
    render(
      <MemoryRouter>
        <QuestContent
          items={[
            {
              text: "[[观察]]这些图片",
              hint: "第二张更重要",
              imageUrl: "https://img.example/cover.jpg",
              imageUrls: ["https://img.example/detail.jpg"],
            },
          ]}
          fallback="fallback"
          onOpenImages={onOpenImages}
          onOpenVideo={vi.fn()}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "查看题目图片 2" }));
    expect(onOpenImages).toHaveBeenCalledWith(
      ["https://img.example/cover.jpg", "https://img.example/detail.jpg"],
      1,
    );
    expect(screen.getByText("观察").tagName).toBe("MARK");
    expect(screen.getByText("查看提示")).toBeInTheDocument();
  });

  it("uses the item image as a video poster", () => {
    const onOpenVideo = vi.fn();
    render(
      <MemoryRouter>
        <QuestContent
          items={[
            {
              imageUrl: "https://img.example/poster.jpg",
              imageUrls: [],
              videoUrl: "https://video.example/movie.mp4",
            },
          ]}
          fallback="fallback"
          onOpenImages={vi.fn()}
          onOpenVideo={onOpenVideo}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "播放题目视频 1" }));
    expect(onOpenVideo).toHaveBeenCalledWith(
      "https://video.example/movie.mp4",
      "https://img.example/poster.jpg",
    );
  });
});
