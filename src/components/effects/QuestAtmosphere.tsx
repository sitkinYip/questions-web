const motes = Array.from({ length: 14 }, (_, index) => index);

export function QuestAtmosphere() {
  return (
    <div className="quest-atmosphere" aria-hidden="true">
      <div className="quest-atmosphere__aurora" />
      <div className="quest-atmosphere__rift" />
      <div className="quest-atmosphere__halo" />
      <div className="quest-atmosphere__sigil">
        <i />
        <i />
        <i />
      </div>
      <div className="quest-atmosphere__rays" />
      <div className="quest-atmosphere__motes">
        {motes.map((mote) => (
          <i key={mote} />
        ))}
      </div>
    </div>
  );
}

export function EnergyBurst({ tone }: { tone: "success" | "danger" }) {
  return (
    <div className={`energy-burst energy-burst--${tone}`} aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => (
        <i key={index} />
      ))}
    </div>
  );
}
