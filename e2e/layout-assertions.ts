import { expect, type Locator } from "@playwright/test";

type LayoutBox = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>;

/** Capture a visible layout box, including across React/Radix replacements. */
export async function visibleBox(locator: Locator): Promise<LayoutBox> {
  await expect(locator).toBeVisible();
  let measured: LayoutBox | undefined;
  await expect
    .poll(
      async () => {
        const box = await locator.boundingBox();
        if (!box || box.width <= 0 || box.height <= 0) return false;
        measured = box;
        return true;
      },
      { message: `Expected a rendered layout box for ${locator}` },
    )
    .toBe(true);
  if (!measured) throw new Error(`No rendered layout box for ${locator}`);
  return measured;
}
