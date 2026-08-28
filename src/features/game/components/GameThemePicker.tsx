import { DesktopIcon, MoonStarsIcon, SunIcon } from "@phosphor-icons/react";
import { useId } from "react";
import { useTheme } from "../../../components/ui/theme-context";

const choices = [
  { value: "system", label: "跟随系统", Icon: DesktopIcon },
  { value: "light", label: "浅色", Icon: SunIcon },
  { value: "dark", label: "深色", Icon: MoonStarsIcon },
] as const;

export function GameThemePicker() {
  const theme = useTheme();
  const name = useId();
  return (
    <fieldset className="game-theme-picker">
      <legend className="sr-only">界面主题</legend>
      {choices.map(({ value, label, Icon }) => (
        <label key={value} title={label}>
          <input
            type="radio"
            aria-label={label}
            name={name}
            value={value}
            checked={theme.preference === value}
            onChange={() => theme.setPreference(value)}
          />
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
