import {
  forwardRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: "surface" | "line";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, variant = "surface", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={joinClasses("ui-input", `ui-input--${variant}`, className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={joinClasses("ui-select", className)}
      {...props}
    />
  );
});

interface FieldProps extends LabelHTMLAttributes<HTMLLabelElement> {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}

export function Field({
  label,
  hint,
  className,
  children,
  ...props
}: FieldProps) {
  return (
    <label className={joinClasses("ui-field", className)} {...props}>
      <span className="ui-field__label">{label}</span>
      {children}
      {hint && <small className="ui-field__hint">{hint}</small>}
    </label>
  );
}
