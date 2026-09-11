/** Runs inside the browser: capture exit before a slow compositor frame can remove it. */
export async function sampleExit(el: HTMLElement, closeText: string | null) {
  const before = el.querySelector(".letter-paper")?.textContent;
  const button = [...el.querySelectorAll<HTMLButtonElement>("button")].find(
    (candidate) => !closeText || candidate.textContent?.includes(closeText),
  );
  if (!button) throw new Error("Exit control is missing");
  return new Promise<{
    before: string | null | undefined;
    after: string | null | undefined;
    state: string | null;
    connected: boolean;
    opacity: number;
    x: number;
    y: number;
  }>((resolve, reject) => {
    const observer = new MutationObserver(capture);
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error("Closing did not start motion-surface-exit"));
    }, 5000);
    function capture() {
      if (el.getAttribute("data-state") !== "closed") return;
      // Force style resolution in the mutation microtask, not a later rAF.
      // The real 240ms exit may finish before rAF on Linux WebKit/software rendering.
      const animation = el
        .getAnimations()
        .find(
          (candidate) =>
            (candidate as CSSAnimation).animationName === "motion-surface-exit",
        );
      if (!animation) return;
      observer.disconnect();
      clearTimeout(timeout);
      animation.pause();
      animation.currentTime =
        Number(animation.effect!.getTiming().duration) / 2;
      const style = getComputedStyle(el);
      const matrix = new DOMMatrixReadOnly(style.transform);
      resolve({
        before,
        after: el.querySelector(".letter-paper")?.textContent,
        state: el.getAttribute("data-state"),
        connected: el.isConnected,
        opacity: Number(style.opacity),
        x: matrix.m41,
        y: matrix.m42,
      });
    }
    observer.observe(el, { attributes: true, attributeFilter: ["data-state"] });
    button.click();
    capture();
  });
}
