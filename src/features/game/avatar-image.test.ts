import { afterEach, expect, it, vi } from "vitest";
import { AVATAR_MAX_BYTES, cropAvatar } from "./avatar-image";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function setup(sizes: number[]) {
  vi.stubGlobal(
    "Image",
    class {
      src = "";
      naturalWidth = 2048;
      naturalHeight = 1536;
      decode = async () => {};
    },
  );
  const drawImage = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage,
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  const dimensions: number[][] = [];
  const encode = vi
    .spyOn(HTMLCanvasElement.prototype, "toBlob")
    .mockImplementation(function (this: HTMLCanvasElement, callback) {
      dimensions.push([this.width, this.height]);
      callback(
        new Blob([new Uint8Array(sizes.shift() ?? AVATAR_MAX_BYTES + 1)], {
          type: "image/jpeg",
        }),
      );
    });
  return { drawImage, encode, dimensions };
}

it("crops only the chosen square and retries encoding until the byte cap is met", async () => {
  const { drawImage, encode, dimensions } = setup([
    AVATAR_MAX_BYTES + 1,
    100_000,
  ]);
  const file = await cropAvatar("blob:preview", {
    x: 100,
    y: 200,
    width: 1000,
    height: 1000,
  });
  expect(drawImage).toHaveBeenCalledWith(
    expect.anything(),
    100,
    200,
    1000,
    1000,
    0,
    0,
    512,
    512,
  );
  expect(dimensions).toEqual([
    [512, 512],
    [512, 512],
  ]);
  expect(encode).toHaveBeenCalledTimes(2);
  expect(file.type).toBe("image/jpeg");
  expect(file.size).toBeLessThanOrEqual(AVATAR_MAX_BYTES);
});

it("refuses to return an oversized result after bounded retries", async () => {
  const { encode } = setup([]);
  await expect(
    cropAvatar("blob:preview", { x: 0, y: 0, width: 1000, height: 1000 }),
  ).rejects.toThrow();
  expect(encode).toHaveBeenCalledTimes(5);
});

it("does not upscale small crops", async () => {
  const { dimensions } = setup([1000]);
  await cropAvatar("blob:preview", { x: 0, y: 0, width: 80, height: 80 });
  expect(dimensions).toEqual([[80, 80]]);
});
