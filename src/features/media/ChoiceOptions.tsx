import { uiCopy } from "@/config/ui-copy";
import type { QuestOption } from "@/domain/quest/types";

interface ChoiceOptionsProps {
  questId: string;
  options: readonly QuestOption[];
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onOpenImage: (url: string) => void;
  onOpenVideo: (url: string, poster?: string) => void;
}

export function ChoiceOptions({
  questId,
  options,
  value,
  disabled,
  onChange,
  onOpenImage,
  onOpenVideo,
}: ChoiceOptionsProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="sr-only">{uiCopy.choiceOptions.legend}</legend>
      <div className="choice-list">
        {options.map((option) => (
          <div
            className={`choice-option ${value === option.key ? "is-selected" : ""}`}
            key={option.key}
          >
            <label>
              <input
                type="radio"
                name={`answer-${questId}`}
                value={option.key}
                checked={value === option.key}
                onChange={(event) => onChange(event.target.value)}
              />
              <strong>{option.key}</strong>
              <span>
                {option.text || uiCopy.choiceOptions.option(option.key)}
              </span>
            </label>
            {(option.imageUrl || option.videoUrl) && (
              <button
                type="button"
                className="choice-media-button"
                onClick={() => {
                  if (option.videoUrl) {
                    onOpenVideo(option.videoUrl, option.imageUrl);
                  } else if (option.imageUrl) {
                    onOpenImage(option.imageUrl);
                  }
                }}
                aria-label={
                  option.videoUrl
                    ? uiCopy.choiceOptions.playVideo(option.key)
                    : uiCopy.choiceOptions.viewImage(option.key)
                }
              >
                {option.imageUrl ? (
                  <img src={option.imageUrl} alt="" loading="lazy" />
                ) : (
                  <span>{uiCopy.choiceOptions.play}</span>
                )}
                {option.videoUrl && <span aria-hidden="true">▶</span>}
              </button>
            )}
          </div>
        ))}
      </div>
    </fieldset>
  );
}
