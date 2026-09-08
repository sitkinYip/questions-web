import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_PREFERENCES_KEY } from "@/infrastructure/storage/theme.repository";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { useTheme } from "@/components/ui/theme-context";

function createMediaQueryList(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  return {
    get matches() {
      return matches;
    },
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.add(listener),
    removeEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.delete(listener),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      listeners.forEach((listener) =>
        listener({ matches: nextMatches } as MediaQueryListEvent),
      );
    },
  };
}

function Harness() {
  const { preference, resolvedTheme, setPreference } = useTheme();
  return (
    <div>
      <span>{`${preference}:${resolvedTheme}`}</span>
      <button onClick={() => setPreference("system")}>系统</button>
      <button onClick={() => setPreference("light")}>浅色</button>
      <button onClick={() => setPreference("dark")}>深色</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("follows live system changes until the user chooses an override", () => {
    const media = createMediaQueryList(false);
    window.matchMedia = vi.fn(() => media as unknown as MediaQueryList);
    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );

    expect(screen.getByText("system:light")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("data-theme", "light");

    fireEvent.click(screen.getByRole("button", { name: "深色" }));
    expect(screen.getByText("dark:dark")).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem(THEME_PREFERENCES_KEY) ?? "null"),
    ).toEqual({ version: 1, preference: "dark" });

    act(() => media.setMatches(false));
    expect(screen.getByText("dark:dark")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "系统" }));
    act(() => media.setMatches(true));
    expect(screen.getByText("system:dark")).toBeInTheDocument();
  });

  it("loads an explicit stored preference before rendering children", () => {
    localStorage.setItem(
      THEME_PREFERENCES_KEY,
      JSON.stringify({ version: 1, preference: "light" }),
    );
    const media = createMediaQueryList(true);
    window.matchMedia = vi.fn(() => media as unknown as MediaQueryList);

    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );

    expect(screen.getByText("light:light")).toBeInTheDocument();
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("uses a valid query preference as the initial override without locking controls", () => {
    localStorage.setItem(
      THEME_PREFERENCES_KEY,
      JSON.stringify({ version: 1, preference: "dark" }),
    );
    window.history.replaceState(null, "", "/?qa=11&theme=light");
    const media = createMediaQueryList(true);
    window.matchMedia = vi.fn(() => media as unknown as MediaQueryList);

    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );

    expect(screen.getByText("light:light")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "深色" }));
    expect(screen.getByText("dark:dark")).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem(THEME_PREFERENCES_KEY) ?? "null"),
    ).toEqual({ version: 1, preference: "dark" });
  });

  it("ignores an invalid query preference", () => {
    localStorage.setItem(
      THEME_PREFERENCES_KEY,
      JSON.stringify({ version: 1, preference: "light" }),
    );
    window.history.replaceState(null, "", "/?theme=sepia");
    const media = createMediaQueryList(true);
    window.matchMedia = vi.fn(() => media as unknown as MediaQueryList);

    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );

    expect(screen.getByText("light:light")).toBeInTheDocument();
  });
});
