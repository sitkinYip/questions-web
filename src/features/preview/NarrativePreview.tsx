import { useEffect } from "react";
import { LetterExperience } from "@/features/letter/LetterExperience";
import { BlessExperience } from "@/features/bless/BlessExperience";
import type { ValidatedPreviewMessage } from "./protocol";

type Narrative = Extract<
  ValidatedPreviewMessage["draft"],
  { kind: "narrative" }
>["value"];

/** Parent remounts for every draft revision; effects/audio are cleaned up by the real players. */
export function NarrativePreview({ narrative }: { narrative: Narrative }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const common = {
    id: narrative.id,
    title: narrative.title,
    revision: narrative.id,
  };
  if (narrative.kind === "letter") {
    return (
      <LetterExperience
        letter={{ ...narrative.payload, ...common }}
        returnTo={null}
      />
    );
  }
  return (
    <>
      {narrative.payload.phrases.length === 0 && (
        <p className="editor-preview-status editor-preview-empty" role="status">
          添加至少一句祝福正文后，可点击开始预览。
        </p>
      )}
      <BlessExperience
        blessing={{ ...narrative.payload, ...common }}
        returnTo={null}
      />
    </>
  );
}
