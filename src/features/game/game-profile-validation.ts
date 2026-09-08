import { uiCopy } from "@/config/ui-copy";
export function validateAvatar(
  file: Pick<File, "type" | "size">,
): string | undefined {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return uiCopy.gameProfileValidation.invalidImageType;
  if (file.size > 50 * 1024 * 1024)
    return uiCopy.gameProfileValidation.imageTooLarge;
}
