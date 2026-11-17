import Image from "next/image";

/** Logo + "WISPI · XCIEN". `subtitle` agrega las barras y la segunda línea (login). */
export function Brand({
  subtitle,
  size = 28,
}: {
  subtitle?: string;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/wispi-logo.png"
        alt="Wispi"
        width={size}
        height={size}
        priority
      />
      {subtitle && (
        <div className="flex h-8 items-stretch gap-[3px]" aria-hidden>
          <span className="w-[3px] rounded-sm bg-gold-500" />
          <span className="w-[3px] rounded-sm bg-gold-500/55" />
          <span className="w-[3px] rounded-sm bg-white/25" />
        </div>
      )}
      <div className="leading-tight">
        <p className="font-black text-[13px] text-white tracking-[0.2em]">
          WISPI · XCIEN
        </p>
        {subtitle && (
          <p className="mt-0.5 whitespace-nowrap font-black text-[9px] text-gold-500 uppercase tracking-[0.3em]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
