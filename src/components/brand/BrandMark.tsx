/** The approved star-and-ring mark, extracted onto a transparent background. */
export function BrandMark({ size = 44 }: { size?: number }) {
  const base = `${import.meta.env.BASE_URL}branding/starward-mark-`;
  return (
    <img
      className="brand-mark"
      src={`${base}96.png`}
      srcSet={`${base}96.png 96w, ${base}192.png 192w`}
      sizes={`${size}px`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
    />
  );
}
