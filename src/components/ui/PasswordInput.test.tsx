import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Field } from "@/components/ui/FormControls";
import { PasswordInput } from "@/components/ui/PasswordInput";

it("keeps a stable field name and value when toggling visibility without submitting", () => {
  const submit = vi.fn((event) => event.preventDefault());
  render(
    <form onSubmit={submit}>
      <Field label="密码" hint="至少十个字符">
        <PasswordInput defaultValue="a-secret-value" />
      </Field>
    </form>,
  );
  const input = screen.getByLabelText("密码", { exact: true });
  expect(input).toHaveAttribute("type", "password");
  expect(input).toHaveAccessibleDescription("至少十个字符");
  fireEvent.click(screen.getByRole("button", { name: "显示密码" }));
  expect(input).toHaveAttribute("type", "text");
  expect(input).toHaveValue("a-secret-value");
  fireEvent.click(screen.getByRole("button", { name: "隐藏密码" }));
  expect(input).toHaveAttribute("type", "password");
  expect(submit).not.toHaveBeenCalled();
});
