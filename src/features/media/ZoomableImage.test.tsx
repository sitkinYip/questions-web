import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ZoomableImage } from "@/features/media/ZoomableImage";

it("resets slider zoom and prevents panning from changing images", () => {
  const onSwipe = vi.fn();
  const { container } = render(
    <ZoomableImage src="/sample.jpg" alt="预览" onSwipe={onSwipe} />,
  );
  fireEvent.change(screen.getByRole("slider"), { target: { value: "3" } });
  expect(screen.getByRole("img").style.transform).toContain("scale(3)");
  const stage = container.querySelector(".media-viewer-stage")!;
  fireEvent.pointerDown(stage, {
    pointerId: 1,
    pointerType: "touch",
    clientX: 200,
    clientY: 100,
  });
  fireEvent.pointerUp(stage, {
    pointerId: 1,
    pointerType: "touch",
    clientX: 60,
    clientY: 100,
  });
  expect(onSwipe).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "复位" }));
  expect(screen.getByRole("slider")).toHaveValue("1");
});

describe("pinch", () => {
  it("zooms with two pointers without treating release as a swipe", () => {
    const onSwipe = vi.fn();
    const { container } = render(
      <ZoomableImage src="/sample.jpg" alt="预览" onSwipe={onSwipe} />,
    );
    const stage = container.querySelector(".media-viewer-stage")!;
    fireEvent.pointerDown(stage, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerDown(stage, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 200,
      clientY: 100,
    });
    fireEvent.pointerMove(stage, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 300,
      clientY: 100,
    });
    expect(screen.getByRole("slider")).toHaveValue("2");
    fireEvent.pointerUp(stage, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 300,
      clientY: 100,
    });
    fireEvent.pointerUp(stage, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 100,
      clientY: 100,
    });
    expect(onSwipe).not.toHaveBeenCalled();
  });
});
