import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GameLoadingScreen } from "./GameLoadingScreen";

describe("GameLoadingScreen", () => {
  it.each([
    ["player", "拾起你的冒险足迹", "正在读取冒险者资料…"],
    ["journey", "下一段冒险，正在苏醒", "正在准备本场冒险…"],
    ["narrative", "故事，正为你展开", "正在准备这份专属内容…"],
  ] as const)(
    "announces the real %s loading stage without fake progress",
    (scene, title, label) => {
      const { container } = render(<GameLoadingScreen scene={scene} />);
      expect(screen.getByRole("main", { name: title })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: title, level: 1 }),
      ).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(label);
      expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      expect(
        container.querySelector(".game-loading-screen__art"),
      ).toHaveAttribute("aria-hidden", "true");
      expect(container.querySelectorAll("img, video, audio")).toHaveLength(0);
    },
  );

  it("preserves the caller's navigation and unmounts without an exit delay", () => {
    const navigate = vi.fn();
    const { rerender } = render(
      <GameLoadingScreen
        scene="narrative"
        header={<button onClick={navigate}>打开冒险者菜单</button>}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "打开冒险者菜单" }));
    expect(navigate).toHaveBeenCalledOnce();
    rerender(<div>内容已就绪</div>);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("内容已就绪")).toBeInTheDocument();
  });
});
