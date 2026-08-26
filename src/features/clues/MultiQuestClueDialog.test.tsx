import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OverlayProvider } from "../../components/ui/OverlayProvider";
import { MultiQuestClueDialog } from "./MultiQuestClueDialog";

describe("MultiQuestClueDialog", () => {
  it("keeps its long-label action in a fixed footer", async () => {
    const onClose = vi.fn();
    const buttonText = "本咪知道了现在就去领取补给";
    render(
      <OverlayProvider>
        <MultiQuestClueDialog
          open
          clue={{
            id: "multi-clue-1",
            qas: "11,12",
            title: "隐藏的本场线索",
            content: "很长的本场线索内容",
            description: "该本场线索会保留在当前会话中。",
            buttonText,
            revision: "r1",
          }}
          onClose={onClose}
        />
      </OverlayProvider>,
    );

    const dialog = await screen.findByRole("dialog", {
      name: "隐藏的本场线索",
    });
    const scrollArea = dialog.querySelector(".multi-clue-dialog-scroll");
    const footer = dialog.querySelector("footer");
    const action = screen.getByRole("button", { name: buttonText });

    expect(scrollArea).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
    expect(scrollArea).not.toContainElement(footer);
    expect(footer).toContainElement(action);

    fireEvent.click(action);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
