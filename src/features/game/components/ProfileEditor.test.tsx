import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { gameApi } from "../../../api/game.client";
import { makePlayer } from "../../../test/game-fixtures";
import { GameContext } from "../useGame";
import { ProfileEditor } from "./ProfileEditor";
import { useProfileEditor } from "../hooks/useProfileEditor";

const revoke = vi.fn();
beforeEach(() => {
  const NativeURL = URL;
  vi.stubGlobal(
    "URL",
    class extends NativeURL {
      static createObjectURL = vi.fn(() => "blob:avatar-preview");
      static revokeObjectURL = revoke;
    },
  );
  revoke.mockClear();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function EditorHarness() {
  const editor = useProfileEditor();
  return <ProfileEditor editor={editor} />;
}

function editor() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const player = makePlayer();
  return render(
    <QueryClientProvider client={client}>
      <GameContext.Provider
        value={{ player, setPlayer: vi.fn(), logout: vi.fn() }}
      >
        <EditorHarness />
      </GameContext.Provider>
    </QueryClientProvider>,
  );
}

it("releases the avatar preview on unmount", () => {
  const view = editor();
  fireEvent.change(screen.getByLabelText("上传头像"), {
    target: {
      files: [new File(["image"], "avatar.png", { type: "image/png" })],
    },
  });
  expect(screen.getByRole("img")).toHaveAttribute("src", "blob:avatar-preview");
  view.unmount();
  expect(revoke).toHaveBeenCalledWith("blob:avatar-preview");
});

it("never submits a previous avatar after a rejected replacement", async () => {
  const save = vi.spyOn(gameApi, "profile").mockResolvedValue(makePlayer());
  editor();
  const input = screen.getByLabelText("上传头像");
  fireEvent.change(input, {
    target: {
      files: [new File(["image"], "avatar.png", { type: "image/png" })],
    },
  });
  fireEvent.change(input, {
    target: {
      files: [new File(["svg"], "bad.svg", { type: "image/svg+xml" })],
    },
  });
  expect(screen.getByRole("alert")).toHaveTextContent("JPG");
  expect(revoke).toHaveBeenCalledWith("blob:avatar-preview");
  fireEvent.click(screen.getByRole("button", { name: "保存资料" }));
  await waitFor(() => expect(save).toHaveBeenCalledOnce());
  expect(save.mock.calls[0][0].has("avatar")).toBe(false);
});
