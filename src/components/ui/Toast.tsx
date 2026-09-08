import { uiCopy } from "@/config/ui-copy";
import { Toast } from "radix-ui";
import { Button } from "@/components/ui/Button";

interface AppToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actionLabel?: string;
  actionAltText?: string;
  onAction?: () => void;
  duration?: number;
  className?: string;
}

export function AppToast({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  actionAltText,
  onAction,
  duration,
  className,
}: AppToastProps) {
  return (
    <Toast.Root
      className={`ui-toast${className ? ` ${className}` : ""}`}
      type="foreground"
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
    >
      <div className="ui-toast__content">
        <Toast.Title className="ui-toast__title">{title}</Toast.Title>
        {description && (
          <Toast.Description className="ui-toast__description">
            {description}
          </Toast.Description>
        )}
      </div>
      {actionLabel && onAction && (
        <Toast.Action asChild altText={actionAltText ?? actionLabel}>
          <Button
            className="ui-toast__action"
            variant="ghost"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        </Toast.Action>
      )}
      <Toast.Close asChild>
        <Button
          className="ui-toast__close"
          variant="icon"
          size="small"
          aria-label={uiCopy.toast.closeTitle(title)}
        >
          ×
        </Button>
      </Toast.Close>
    </Toast.Root>
  );
}
