"use client";

import { AlertTriangle, CircleCheck, Info, MapPinOff, X } from "lucide-react";
import { useEffect } from "react";

export type NoticeData = {
  type: "success" | "warning" | "danger" | "info";
  title: string;
  message?: string;
  /** Los avisos de geocerca (fuera / sin GPS) se quedan hasta que se cierran. */
  sticky?: boolean;
};

const STYLES = {
  success: {
    Icon: CircleCheck,
    tone: "text-ok",
    ring: "border-ok/30 bg-ok/10",
  },
  warning: {
    Icon: MapPinOff,
    tone: "text-warn",
    ring: "border-warn/30 bg-warn/10",
  },
  danger: {
    Icon: AlertTriangle,
    tone: "text-bad",
    ring: "border-bad/30 bg-bad/10",
  },
  info: {
    Icon: Info,
    tone: "text-gold-500",
    ring: "border-gold-500/30 bg-gold-500/10",
  },
};

export function Notice({
  notice,
  onClose,
}: {
  notice: NoticeData;
  onClose: () => void;
}) {
  useEffect(() => {
    if (notice.sticky) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [notice, onClose]);

  const { Icon, tone, ring } = STYLES[notice.type];
  return (
    <div
      role={notice.type === "danger" ? "alert" : "status"}
      className={`flex animate-rise gap-3 rounded-2xl border px-4 py-3.5 ${ring}`}
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${tone}`} />
      <div className="min-w-0 flex-1">
        <p className={`font-bold text-[14px] ${tone}`}>{notice.title}</p>
        {notice.message && (
          <p className="mt-0.5 text-[13px] text-white/75 leading-snug">
            {notice.message}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="-m-1 self-start p-1 text-muted"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
