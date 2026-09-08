import { uiCopy } from "@/config/ui-copy";

export const AVATAR_MAX_BYTES = 200 * 1024;
export const AVATAR_EDGE = 512;
export interface AvatarArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error(uiCopy.avatarCrop.failed)),
      "image/jpeg",
      quality,
    ),
  );
}

export async function prepareAvatar(file: File): Promise<string> {
  // Decode only after selection, honor camera orientation, and release the full
  // resolution bitmap before users start dragging the bounded preview.
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const canvas = document.createElement("canvas");
  try {
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error(uiCopy.avatarCrop.failed);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  } finally {
    bitmap.close();
  }
  try {
    return URL.createObjectURL(await encode(canvas, 0.95));
  } finally {
    canvas.width = canvas.height = 0;
  }
}

export async function cropAvatar(
  source: string,
  area: AvatarArea,
): Promise<File> {
  const image = new Image();
  image.src = source;
  await image.decode();
  const canvas = document.createElement("canvas");
  try {
    const side = Math.min(area.width, area.height);
    if (
      !Number.isFinite(side) ||
      side <= 0 ||
      area.x < 0 ||
      area.y < 0 ||
      area.x + side > image.naturalWidth + 1 ||
      area.y + side > image.naturalHeight + 1
    )
      throw new Error(uiCopy.avatarCrop.failed);
    canvas.width = canvas.height = Math.min(
      AVATAR_EDGE,
      Math.max(1, Math.round(side)),
    );
    const context = canvas.getContext("2d");
    if (!context) throw new Error(uiCopy.avatarCrop.failed);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingQuality = "high";
    context.drawImage(
      image,
      area.x,
      area.y,
      side,
      side,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    for (const quality of [0.88, 0.78, 0.65, 0.5, 0.35]) {
      const blob = await encode(canvas, quality);
      if (blob.size <= AVATAR_MAX_BYTES)
        return new File([blob], "avatar.jpg", { type: "image/jpeg" });
    }
    throw new Error(uiCopy.avatarCrop.failed);
  } finally {
    canvas.width = canvas.height = 0;
    image.src = "";
  }
}
