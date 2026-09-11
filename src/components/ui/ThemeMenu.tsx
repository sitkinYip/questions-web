import { uiCopy } from "@/config/ui-copy";
import { DropdownMenu } from "radix-ui";
import type { ThemePreference } from "@/shared/theme/theme";
import { useOptionalTheme } from "@/components/ui/theme-context";

const options: Array<{
  value: ThemePreference;
  label: string;
  description: string;
}> = [
  {
    value: "system",
    label: uiCopy.themeMenu.system,
    description: uiCopy.themeMenu.systemDescription,
  },
  {
    value: "light",
    label: uiCopy.themeMenu.light,
    description: uiCopy.themeMenu.lightDescription,
  },
  {
    value: "dark",
    label: uiCopy.themeMenu.dark,
    description: uiCopy.themeMenu.darkDescription,
  },
];

const resolvedLabels = {
  light: uiCopy.themeMenu.light,
  dark: uiCopy.themeMenu.dark,
} as const;

export interface ThemeMenuProps {
  avatarUrl?: string;
  displayName: string;
}

export function ThemeMenu({ avatarUrl, displayName }: ThemeMenuProps) {
  const theme = useOptionalTheme();
  const preference = theme?.preference ?? "system";
  const resolvedTheme = theme?.resolvedTheme ?? "dark";
  const setPreference = theme?.setPreference ?? (() => undefined);
  const fallback = Array.from(
    displayName.trim() || uiCopy.themeMenu.avatarFallback,
  )[0];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="theme-avatar-trigger"
          type="button"
          aria-label={uiCopy.themeMenu.switchLabel(
            resolvedLabels[resolvedTheme],
          )}
          title={uiCopy.themeMenu.switchTitle}
        >
          {avatarUrl ? (
            <img
              className="traveler-avatar"
              src={avatarUrl}
              alt={uiCopy.themeMenu.avatarAlt(displayName)}
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
          data-motion-menu
          className="theme-menu"
          sideOffset={10}
          align="start"
          collisionPadding={16}
        >
          <DropdownMenu.Label className="theme-menu__heading">
            <span>{uiCopy.themeMenu.title}</span>
            <small>
              {uiCopy.themeMenu.currentTheme(resolvedLabels[resolvedTheme])}
            </small>
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
