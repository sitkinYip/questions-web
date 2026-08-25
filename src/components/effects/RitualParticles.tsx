export function RitualParticles({ variant }: { variant: "gold" | "teal" }) {
  return (
    <div
      className={`ritual-particles ritual-particles--${variant}`}
      aria-hidden="true"
    >
      {Array.from({ length: 20 }, (_, index) => (
        <i key={index} />
      ))}
    </div>
  );
}
