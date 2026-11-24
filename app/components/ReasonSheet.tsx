"use client";

import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { OutReason } from "../lib/types";

// Respaldo si el estado en caché viene de una versión anterior de Odoo
export const DEFAULT_OUT_REASONS: OutReason[] = [
  { value: "lunch", label: "Salida a comer" },
  { value: "errand", label: "Tienda" },
  { value: "personal", label: "Asunto personal" },
  { value: "field_visit", label: "Comisión / visita a cliente" },
  { value: "medical", label: "Médico" },
  { value: "other", label: "Otro" },
];

/** Nombre de un motivo de salida temporal. */
export function reasonLabel(reason?: string | null, reasons?: OutReason[]) {
  if (!reason) return "";
  return (
    reasons?.find((r) => r.value === reason)?.label ??
    DEFAULT_OUT_REASONS.find((r) => r.value === reason)?.label ??
    reason
  );
}

const NOTE_MAX = 200;

type Props = {
  reasons?: OutReason[];
  onCancel: () => void;
  onConfirm: (reason: string, note: string | null) => void;
};

/**
 * Hoja para elegir el motivo de una salida temporal (tienda, personal, …).
 * La comida tiene su propio botón, por eso no aparece aquí.
 */
export function ReasonSheet({ reasons, onCancel, onConfirm }: Props) {
  const options = (reasons?.length ? reasons : DEFAULT_OUT_REASONS).filter(
    (r) => r.value !== "lunch",
  );
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const needsNote = reason === "other";
  const canConfirm = !!reason && (!needsNote || note.trim().length > 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const confirm = () => {
    if (!reason || !canConfirm) return;
    onConfirm(reason, note.trim() || null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Motivo de la salida"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center"
    >
      <div className="pb-safe w-full max-w-[440px] animate-sheet rounded-t-[28px] border border-line bg-ink-900 sm:rounded-[28px]">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <p className="eyebrow text-gold-500">Salida temporal</p>
            <h2 className="font-extrabold text-lg text-white">
              ¿A dónde sales?
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              Tu tiempo se pausa hasta que marques tu regreso.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancelar"
            className="flex size-10 items-center justify-center rounded-full border border-line text-muted hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-2 px-5 pt-4">
          {options.map((o) => {
            const selected = reason === o.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setReason(o.value)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left font-bold text-[14px] transition ${
                  selected
                    ? "border-gold-500/70 bg-gold-500/10 text-gold-500"
                    : "border-line bg-ink-850 text-white/85"
                }`}
              >
                {o.label}
                {selected && <Check className="size-4" />}
              </button>
            );
          })}
          {needsNote && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
              placeholder="Escribe el motivo"
              rows={2}
              // biome-ignore lint/a11y/noAutofocus: el campo aparece al elegir "Otro"
              autoFocus
              className="w-full resize-none rounded-2xl border border-line bg-ink-950 px-4 py-3 text-[14px] text-white placeholder:text-subtle focus:border-gold-500/60 focus:outline-none"
            />
          )}
        </div>

        <div className="px-5 pt-4 pb-5">
          <button
            type="button"
            onClick={confirm}
            disabled={!canConfirm}
            className="gold-gradient w-full rounded-2xl py-3.5 font-black text-[14px] text-ink-950 uppercase tracking-[0.14em] disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
