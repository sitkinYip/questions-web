import type { GameExtra } from "@/api/game.contracts";

/** Passive, server-resolved text only; never interprets game rules or HTML. */
export function ExtraMessages({ value }: { value: GameExtra }) {
  if (!value.extraDisplay?.length) return null;
  return (
    <div className="game-extra-messages">
      {value.extraDisplay.map((item) => (
        <p key={item.key} className="game-extra-message">
          <span>{item.label}</span>
          {item.text}
        </p>
      ))}
    </div>
  );
}
