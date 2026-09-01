import {
  CheckCircleIcon,
  InfoIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

interface AnswerFeedbackProps {
  message: string;
  tone: "neutral" | "success" | "danger";
  autoDismiss?: boolean;
}

const feedbackLabels = {
  neutral: "尚未提交",
  success: "验证通过",
  danger: "验证未通过",
} as const;

export function AnswerFeedback({
  message,
  tone,
  autoDismiss = false,
}: AnswerFeedbackProps) {
  const Icon =
    tone === "success"
      ? CheckCircleIcon
      : tone === "danger"
        ? WarningCircleIcon
        : InfoIcon;

  return (
    <div
      className="feedback"
      data-tone={tone}
      role="status"
      aria-live={tone === "danger" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <span className="feedback__emblem" aria-hidden="true">
        <Icon weight="duotone" />
        <i />
      </span>
      <span className="feedback__content">
        <strong>{feedbackLabels[tone]}</strong>
        <span>{message}</span>
      </span>
      {autoDismiss && (
        <span className="feedback__lifeline" aria-hidden="true" />
      )}
    </div>
  );
}
