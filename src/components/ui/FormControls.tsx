import {
  forwardRef,
  cloneElement,
  useId,
  type InputHTMLAttributes,
  type HTMLAttributes,
  type ReactElement,
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

interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactElement<{ id?: string; "aria-describedby"?: string }>;
}

export function Field({
  label,
  hint,
  className,
  children,
  ...props
}: FieldProps) {
  const generatedId = useId();
  const controlId = children.props.id ?? generatedId;
  const hintId = `${controlId}-hint`;
  return (
    <div className={joinClasses("ui-field", className)} {...props}>
      <label className="ui-field__label" htmlFor={controlId}>
        {label}
      </label>
      {cloneElement(children, {
        id: controlId,
        "aria-describedby":
          [children.props["aria-describedby"], hint ? hintId : undefined]
            .filter(Boolean)
            .join(" ") || undefined,
      })}
      {hint && (
        <small id={hintId} className="ui-field__hint">
          {hint}
        </small>
      )}
    </div>
  );
}
