/**
 * Logo Saung Jalu (lingkaran, sudah di-crop & diperkecil dari logo.png asli
 * supaya ringan di jaringan seluler). size = diameter dalam px.
 */
export default function Logo({ size = 64, className = "", alt = "Saung Jalu", eager = false }) {
  const src = size <= 48 ? "/logo-96.png" : "/logo-320.png";
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      decoding="async"
      loading={eager ? "eager" : "lazy"}
      draggable="false"
      style={{ width: size, height: size }}
      className={`select-none rounded-full object-contain ${className}`}
    />
  );
}
