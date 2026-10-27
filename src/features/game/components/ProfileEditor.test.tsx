import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { gameApi } from "@/api/game.client";
import { makePlayer } from "@/test/game-fixtures";
import { GameContext } from "@/features/game/useGame";
import { ProfileEditor } from "@/features/game/components/ProfileEditor";
import { useProfileEditor } from "@/features/game/hooks/useProfileEditor";
import { ToastProvider } from "@/components/ui/ToastProvider";

vi.mock("./AvatarCropDialog", () => ({
  default: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (file: File) => void;
    onCancel: () => void;
  }) => (
    <div role="dialog">
      <button
        onClick={() =>
          onConfirm(new File(["cropped"], "avatar.jpg", { type: "image/jpeg" }))
        }
      >
        使用此头像
      </button>
      <button onClick={onCancel}>取消</button>
    </div>
  ),
}));

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
        <ToastProvider>
          <MemoryRouter>
            <EditorHarness />
          </MemoryRouter>
        </ToastProvider>
      </GameContext.Provider>
    </QueryClientProvider>,
  );
}

it.each([
  ["image/svg+xml", 5, "请选择 JPG、PNG 或 WebP 图片。"],
  ["image/png", 50 * 1024 * 1024 + 1, "原图超过 50 MB，请选择小一点的图片。"],
])(
  "shows an avatar error toast with the rejection reason for %s",
  (type, size, reason) => {
    editor();
    const file = new File(["image"], "avatar", { type });
    Object.defineProperty(file, "size", { value: size });
    fireEvent.change(screen.getByLabelText("上传头像"), {
      target: { files: [file] },
    });
    const toast = screen.getByRole("listitem");
    expect(within(toast).getByText("更换头像失败")).toBeVisible();
    expect(within(toast).getByText(reason)).toBeVisible();
    expect(screen.queryByRole("dialog")).toBeNull();
  },
);

it("restarts the toast for repeated invalid selections and reopens after dismissal", () => {
  editor();
  const input = screen.getByLabelText("上传头像");
  const selectInvalidFile = () =>
    fireEvent.change(input, {
      target: {
        files: [new File(["svg"], "bad.svg", { type: "image/svg+xml" })],
      },
    });
  selectInvalidFile();
  const previousToast = screen.getByRole("listitem");
  selectInvalidFile();
  expect(screen.getByRole("listitem")).not.toBe(previousToast);
  fireEvent.click(screen.getByRole("button", { name: "关闭更换头像失败" }));
  expect(screen.queryByText("更换头像失败")).toBeNull();
  selectInvalidFile();
  expect(screen.getByText("更换头像失败")).toBeVisible();
});

it("shows the server rejection in a toast and preserves the profile draft", async () => {
  vi.spyOn(gameApi, "profile").mockRejectedValue(
    new Error("头像保存失败，请重试"),
  );
  editor();
  fireEvent.change(screen.getByLabelText("显示昵称"), {
    target: { value: "等待保存的旅人" },
  });
  fireEvent.click(screen.getByRole("button", { name: "保存资料" }));
  await screen.findByText("资料保存失败");
  const toast = screen.getByRole("listitem");
  expect(within(toast).getByText("头像保存失败，请重试")).toBeVisible();
  expect(screen.getByLabelText("显示昵称")).toHaveValue("等待保存的旅人");
  expect(screen.getByRole("button", { name: "保存资料" })).toBeEnabled();
});

it("releases the avatar preview on unmount", async () => {
  const view = editor();
  fireEvent.change(screen.getByLabelText("上传头像"), {
    target: {
      files: [new File(["image"], "avatar.png", { type: "image/png" })],
    },
  });
  fireEvent.click(await screen.findByRole("button", { name: "使用此头像" }));
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
  fireEvent.click(await screen.findByRole("button", { name: "使用此头像" }));
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

it("uploads only the confirmed crop and keeps saving disabled while editing", async () => {
  const save = vi.spyOn(gameApi, "profile").mockResolvedValue(makePlayer());
  editor();
  fireEvent.change(screen.getByLabelText("上传头像"), {
    target: {
      files: [new File(["original"], "photo.png", { type: "image/png" })],
    },
  });
  expect(screen.getByRole("button", { name: "保存资料" })).toBeDisabled();
  fireEvent.click(await screen.findByRole("button", { name: "使用此头像" }));
  fireEvent.click(screen.getByRole("button", { name: "保存资料" }));
  await waitFor(() => expect(save).toHaveBeenCalledOnce());
  const file = save.mock.calls[0][0].get("avatar") as File;
  expect(file.name).toBe("avatar.jpg");
  expect(file.size).toBe(7);
});

it("cancels without staging or uploading the original", async () => {
  const save = vi.spyOn(gameApi, "profile").mockResolvedValue(makePlayer());
  editor();
  fireEvent.change(screen.getByLabelText("上传头像"), {
    target: {
      files: [new File(["original"], "photo.png", { type: "image/png" })],
    },
  });
  fireEvent.click(await screen.findByRole("button", { name: "取消" }));
  fireEvent.click(screen.getByRole("button", { name: "保存资料" }));
  await waitFor(() => expect(save).toHaveBeenCalledOnce());
  expect(save.mock.calls[0][0].has("avatar")).toBe(false);
});
