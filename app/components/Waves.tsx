/** Líneas onduladas doradas del fondo (decorativas). */
export function Waves({ className = "" }: { className?: string }) {
  const lines = Array.from({ length: 9 }, (_, i) => i);
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorativo (aria-hidden)
    <svg
      aria-hidden
      viewBox="0 0 400 140"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 w-full ${className}`}
    >
      {lines.map((i) => {
        const y = 40 + i * 9;
        return (
          <path
            key={i}
            d={`M0 ${y + 10} C 90 ${y - 18}, 170 ${y + 26}, 260 ${y + 2} S 380 ${y - 30}, 400 ${y - 34}`}
            fill="none"
            stroke="var(--color-gold-500)"
            strokeOpacity={0.09 + (i % 3) * 0.03}
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}
