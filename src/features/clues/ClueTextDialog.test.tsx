import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OverlayProvider } from "@/components/ui/OverlayProvider";
import { ClueTextDialog } from "@/features/clues/ClueTextDialog";

describe("ClueTextDialog", () => {
  it("keeps the close control outside the scrollable clue content", async () => {
    const onClose = vi.fn();
    render(
      <OverlayProvider>
        <ClueTextDialog
          clue={{
            id: "clue-1",
            kind: "text",
            title: "成就达成",
            content:
              "很长的线索内容 {{https://img.example/very-wide-image.jpg}}",
            autoPlay: false,
            imageUrls: [],
          }}
          onClose={onClose}
        />
      </OverlayProvider>,
    );

    const dialog = await screen.findByRole("dialog", { name: "成就达成" });
    const close = screen.getByRole("button", { name: "关闭线索" });
    const scrollArea = dialog.querySelector(".clue-dialog-scroll");

    expect(scrollArea).toBeInTheDocument();
    expect(scrollArea).not.toContainElement(close);
    expect(scrollArea?.querySelector("img")).toBeInTheDocument();

    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
