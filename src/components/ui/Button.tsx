import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  "primary" | "secondary" | "danger" | "ghost" | "icon";
export type ButtonSize = "small" | "medium";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "secondary", size = "medium", type, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={joinClasses(
          "ui-button",
          `ui-button--${variant}`,
          `ui-button--${size}`,
          className,
        )}
        {...props}
      />
    );
  },
);
