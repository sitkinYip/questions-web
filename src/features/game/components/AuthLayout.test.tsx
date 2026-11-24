import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { AuthLayout } from "@/features/game/components/AuthLayout";

describe("AuthLayout", () => {
  it("renders the rotating star-ring emblem hero alongside the brand PNG mark", () => {
    const { container } = render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthLayout>
            <div>登录表单</div>
          </AuthLayout>
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("登录表单")).toBeInTheDocument();
    expect(container.querySelector(".game-auth__mark")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(
      container.querySelector(
        ".game-auth__mark .star-ring-loader.star-ring-loader--hero svg",
      ),
    ).toBeInTheDocument();
    expect(container.querySelector(".game-brand .brand-mark")).toHaveAttribute(
      "src",
      "/branding/starward-mark-96.png",
    );
  });
});
