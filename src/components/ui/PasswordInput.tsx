import { uiCopy } from "@/config/ui-copy";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { Input, type InputProps } from "@/components/ui/FormControls";

export function PasswordInput(props: Omit<InputProps, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="ui-password">
      <Input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="ui-password__toggle"
        aria-label={
          visible
            ? uiCopy.passwordInput.hidePassword
            : uiCopy.passwordInput.showPassword
        }
        aria-pressed={visible}
        onClick={() => setVisible(!visible)}
      >
        {visible ? (
          <EyeSlashIcon aria-hidden="true" />
        ) : (
          <EyeIcon aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
