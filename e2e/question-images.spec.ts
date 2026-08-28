import { expect, test } from "@playwright/test";
import { login, mockQuestionsApi } from "./fixtures";
import {
  imageAssignment,
  imageContent,
  questionImages,
} from "./question-image-fixtures";

for (const theme of ["light", "dark"] as const) {
  test(`question images keep a tight transparent frame and full proportions in ${theme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 720 });
    const { assignment } = await mockQuestionsApi(page);
    Object.assign(assignment, structuredClone(imageAssignment), {
      id: "assignment1",
      player: "playeralice",
    });
    assignment.levels[0].question!.content = [
      ...structuredClone(imageContent),
      { ...imageContent[0], imageUrls: questionImages.slice(1) },
      {
        ...imageContent[0],
        imageUrl: "",
        text: `正文里的星图 {{${questionImages[1]}}}`,
      },
    ];
    await login(page, `/play/assignment1?theme=${theme}`);

    const images = page.locator(
      ".question-image img, .question-gallery img, .quest-prompt img",
    );
    await expect(images).toHaveCount(7);
    for (const size of [
      { width: 1280, height: 720 },
      { width: 390, height: 844 },
      { width: 320, height: 740 },
    ]) {
      await page.setViewportSize(size);
      await expect(page.locator(".desktop-question")).toHaveCount(
        size.width >= 1100 ? 1 : 0,
      );
      await expect(images).toHaveCount(7);
      for (const img of await images.all()) {
        await img.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            img.evaluate(
              (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
            ),
          )
          .toBe(true);
        const layout = await img.evaluate((el: HTMLImageElement) => {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const borderX =
            parseFloat(style.borderLeftWidth) +
            parseFloat(style.borderRightWidth);
          const borderY =
            parseFloat(style.borderTopWidth) +
            parseFloat(style.borderBottomWidth);
          const button = el.closest("button");
          const frame = button?.getBoundingClientRect();
          return {
            aspectError: Math.abs(
              (rect.width - borderX) / (rect.height - borderY) -
                el.naturalWidth / el.naturalHeight,
            ),
            frameError: frame
              ? Math.max(
                  Math.abs(frame.width - rect.width),
                  Math.abs(frame.height - rect.height),
                )
              : 0,
            background: style.backgroundColor,
            buttonBackground: button
              ? getComputedStyle(button).backgroundColor
              : "rgba(0, 0, 0, 0)",
            fit: style.objectFit,
            croppedOnHover: style.transform !== "none",
            pageFits: document.documentElement.scrollWidth <= innerWidth + 1,
          };
        });
        expect(layout.aspectError).toBeLessThan(0.015);
        expect(layout.frameError).toBeLessThanOrEqual(1);
        expect(layout.background).toBe("rgba(0, 0, 0, 0)");
        expect(layout.buttonBackground).toBe("rgba(0, 0, 0, 0)");
        expect(layout.fit).toBe("contain");
        expect(layout.croppedOnHover).toBe(false);
        expect(layout.pageFits).toBe(true);
      }
      const gallery = page.locator(".question-gallery");
      const second = gallery.getByRole("button", { name: "查看题目图片 2" });
      // Safari pointer activation does not retain button focus. Check the
      // keyboard focus-return contract using keyboard activation throughout.
      await second.focus();
      await page.keyboard.press("Enter");
      const viewer = page.getByRole("dialog", { name: "图片预览" });
      await expect(viewer).toBeVisible();
      await expect(viewer.locator(".media-viewer-stage img")).toHaveAttribute(
        "src",
        questionImages[1],
      );
      await page.getByRole("button", { name: "下一张" }).click();
      await expect(viewer.locator(".media-viewer-stage img")).toHaveAttribute(
        "src",
        questionImages[2],
      );
      await page.getByRole("button", { name: "关闭媒体预览" }).click();
      await expect(viewer).toHaveCount(0);
      await expect(second).toBeFocused();
    }

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator(".desktop-question")).toHaveCount(1);
    const single = page.locator(".question-image button").first();
    await single.hover();
    await expect(single.locator("img")).toHaveCSS("transform", "none");
    await expect(single).toHaveCSS("box-shadow", "none");
    await expect(single.locator("img")).not.toHaveCSS("box-shadow", "none");
  });
}
