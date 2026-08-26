import { DropdownMenu } from "radix-ui";
import type { ThemePreference } from "../../shared/theme/theme";
import { useOptionalTheme } from "./theme-context";

const options: Array<{
  value: ThemePreference;
  label: string;
  description: string;
}> = [
  { value: "system", label: "跟随系统", description: "随设备外观自动切换" },
  { value: "light", label: "浅色", description: "暖象牙纸与古金" },
  { value: "dark", label: "深色", description: "暗夜与香槟金" },
];

const resolvedLabels = { light: "浅色", dark: "深色" } as const;

export interface ThemeMenuProps {
  avatarUrl?: string;
  displayName: string;
}

export function ThemeMenu({ avatarUrl, displayName }: ThemeMenuProps) {
  const theme = useOptionalTheme();
  const preference = theme?.preference ?? "system";
  const resolvedTheme = theme?.resolvedTheme ?? "dark";
  const setPreference = theme?.setPreference ?? (() => undefined);
  const fallback = Array.from(displayName.trim() || "旅")[0];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="theme-avatar-trigger"
          type="button"
          aria-label={`切换主题，当前为${resolvedLabels[resolvedTheme]}`}
          title="切换主题"
        >
          {avatarUrl ? (
            <img
              className="traveler-avatar"
              src={avatarUrl}
              alt={`${displayName}的头像`}
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <span className="traveler-avatar traveler-avatar--fallback">
              {fallback}
            </span>
          )}
          <span className="theme-avatar-indicator" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="theme-menu"
          sideOffset={10}
          align="start"
          collisionPadding={16}
        >
          <DropdownMenu.Label className="theme-menu__heading">
            <span>界面主题</span>
            <small>当前显示为{resolvedLabels[resolvedTheme]}</small>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="theme-menu__separator" />
          <DropdownMenu.RadioGroup
            value={preference}
            onValueChange={(value) => setPreference(value as ThemePreference)}
          >
            {options.map((option) => (
              <DropdownMenu.RadioItem
                className="theme-menu__item"
                value={option.value}
                key={option.value}
              >
                <span className="theme-menu__copy">
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
                <DropdownMenu.ItemIndicator className="theme-menu__check">
                  ✓
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
          <DropdownMenu.Arrow className="theme-menu__arrow" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
