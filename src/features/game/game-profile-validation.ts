export function validateAvatar(
  file: Pick<File, "type" | "size">,
): string | undefined {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "请选择 JPG、PNG 或 WebP 图片。";
  if (file.size > 2 * 1024 * 1024) return "图片超过 2 MB，换一张小一点的吧。";
}
