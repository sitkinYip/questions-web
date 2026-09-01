import {
  ArrowUpRightIcon,
  EnvelopeSimpleOpenIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { QuestClue } from "../../domain/quest/types";

interface NarrativeAttentionBeaconProps {
  clue: QuestClue;
  onOpen: (clue: QuestClue) => void;
}

function withReturnTo(href: string, returnTo: string) {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}

export function NarrativeAttentionBeacon({
  clue,
  onOpen,
}: NarrativeAttentionBeaconProps) {
  if (!clue.href || (clue.kind !== "letter" && clue.kind !== "bless"))
    return null;
  const isLetter = clue.kind === "letter";
  const returnTo = `${window.location.pathname}${window.location.search}`;
  return (
    <Link
      className="narrative-attention-beacon"
      to={withReturnTo(clue.href, returnTo)}
      data-kind={clue.kind}
      data-attention="true"
      onClick={() => onOpen(clue)}
      aria-label={`${isLetter ? "一封来信等待开启" : "一份祝福正在回响"}：${clue.title || "重要内容"}`}
    >
      <span className="narrative-attention-beacon__emblem" aria-hidden="true">
        {isLetter ? (
          <EnvelopeSimpleOpenIcon weight="duotone" />
        ) : (
          <SparkleIcon weight="duotone" />
        )}
        <i />
      </span>
      <span className="narrative-attention-beacon__copy">
        <small>IMPORTANT SIGNAL</small>
        <strong>{isLetter ? "一封来信等待开启" : "一份祝福正在回响"}</strong>
        <span>{clue.title || "重要内容已解锁"}</span>
      </span>
      <ArrowUpRightIcon
        className="narrative-attention-beacon__arrow"
        aria-hidden="true"
      />
    </Link>
  );
}
