import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSurfaceLight } from "./useSurfaceLight";

function LightProbe({ disabled = false }: { disabled?: boolean }) {
  const light = useSurfaceLight(disabled);
  return (
    <div data-testid="surface" {...light}>
      光感容器
    </div>
  );
}

describe("useSurfaceLight", () => {
  it("指针移动时写入相对坐标并激活光感标记，离开时清除", () => {
    render(<LightProbe />);
    const el = screen.getByTestId("surface");
    el.getBoundingClientRect = () =>
      ({
        left: 100,
        top: 50,
        width: 200,
        height: 120,
        right: 300,
        bottom: 170,
        x: 100,
        y: 50,
        toJSON: () => {},
      }) as DOMRect;

    fireEvent.pointerMove(el, { clientX: 164, clientY: 92 });
    expect(el.style.getPropertyValue("--light-x")).toBe("64px");
    expect(el.style.getPropertyValue("--light-y")).toBe("42px");
    expect(el.dataset.lightActive).toBe("true");

    fireEvent.pointerLeave(el);
    expect(el.dataset.lightActive).toBeUndefined();
  });

  it("禁用时不激活光感状态", () => {
    render(<LightProbe disabled />);
    const el = screen.getByTestId("surface");
    fireEvent.pointerMove(el, { clientX: 20, clientY: 20 });
    expect(el.dataset.lightActive).toBeUndefined();
  });
});
