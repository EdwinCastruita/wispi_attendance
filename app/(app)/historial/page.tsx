"use client";

import {
  ArrowRight,
  Camera,
  CloudOff,
  CloudUpload,
  DoorOpen,
  Loader2,
  Utensils,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../../components/TopBar";
import { ApiError, apiFetch } from "../../lib/api";
import {
  actionLabel,
  dayKey,
  formatDayLabel,
  formatHours,
  formatTime,
} from "../../lib/format";
import { loadCachedHistory, saveCachedHistory } from "../../lib/offline-cache";
import { useStatus } from "../../lib/status-context";
import type {
  GeofenceState,
  HistoryRecord,
  HistoryResponse,
} from "../../lib/types";

const RANGES = [7, 15, 31];

const GEO_BADGE: Partial<
  Record<GeofenceState, { label: string; cls: string }>
> = {
  inside: { label: "Dentro", cls: "bg-ok/10 text-ok border-ok/25" },
  outside: { label: "Fuera", cls: "bg-bad/10 text-bad border-bad/25" },
  no_gps: { label: "Sin GPS", cls: "bg-warn/10 text-warn border-warn/25" },
  recorded: { label: "GPS", cls: "bg-white/5 text-white/70 border-line" },
};

export default function HistorialPage() {
  const { status, pending, online } = useStatus();
  const tz = status?.employee.tz;
  const [days, setDays] = useState(7);
  const [records, setRecords] = useState<HistoryRecord[] | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState("");
  // Recarga cuando se terminan de enviar los pendientes
  const pendingCount = pending.length;

  // biome-ignore lint/correctness/useExhaustiveDependencies: pendingCount recarga al terminar de enviar pendientes
  useEffect(() => {
    const controller = new AbortController();
    const cached = loadCachedHistory(days);
    setRecords(cached);
    setFromCache(Boolean(cached));
    setError("");
    apiFetch<HistoryResponse>("/history", {
      body: { days },
      signal: controller.signal,
    })
      .then((res) => {
        setRecords(res.records);
        setFromCache(false);
        saveCachedHistory(days, res.records);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 0) {
          // Sin señal: se queda lo último que se vio
          if (!cached)
            setError(
              "Sin conexión. El historial se mostrará cuando recuperes señal.",
            );
          return;
        }
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
      });
    return () => controller.abort();
  }, [days, pendingCount]);

  const groups = useMemo(() => {
    const map = new Map<string, HistoryRecord[]>();
    for (const r of records ?? []) {
      const key = dayKey(r.check_in, tz);
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return [...map.entries()].map(([key, items]) => ({
      key,
      label: formatDayLabel(items[0].check_in, tz),
      items,
      total: items.reduce((sum, r) => sum + (r.worked_hours || 0), 0),
    }));
  }, [records, tz]);

  const totalHours = groups.reduce((s, g) => s + g.total, 0);

  return (
    <>
      <TopBar employee={status?.employee} />
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pt-8 pb-6 md:px-10 md:pt-12 lg:grid lg:max-w-6xl lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-12 lg:px-12 lg:pt-14">
        <div className="lg:sticky lg:top-14">
          <p className="eyebrow">Tus registros</p>
          <h1 className="mt-1.5 font-extrabold text-[28px] text-white tracking-tight md:text-[36px]">
            Historial
          </h1>

          <div
            className="mt-5 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-ink-850 p-1"
            role="tablist"
          >
            {RANGES.map((d) => (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={days === d}
                onClick={() => setDays(d)}
                className={`h-10 rounded-xl font-bold text-[12px] uppercase tracking-[0.1em] transition ${
                  days === d
                    ? "bg-gold-500/15 text-gold-500"
                    : "text-muted hover:text-white"
                }`}
              >
                {d} días
              </button>
            ))}
          </div>

          {records && records.length > 0 && (
            <div className="mt-4 grid grid-cols-2 divide-x divide-line rounded-2xl border border-line">
              <div className="px-4 py-3">
                <p className="eyebrow text-[10px]">Días trabajados</p>
                <p className="mt-1 font-extrabold text-[18px] text-white">
                  {groups.length}
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="eyebrow text-[10px]">Horas</p>
                <p className="mt-1 font-extrabold text-[18px] text-gold-500">
                  {formatHours(totalHours)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex-1 lg:mt-0">
          {pending.length > 0 && (
            <div className="mb-5 animate-rise">
              <div className="mb-2 flex items-center gap-2">
                <CloudUpload className="size-4 text-gold-500" />
                <h2 className="font-bold text-[13px] text-gold-500">
                  Pendientes de enviar
                </h2>
              </div>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-gold-500/25 bg-gold-500/[0.05]">
                {pending.map((p) => (
                  <li
                    key={p.uuid}
                    className="flex items-center gap-3 px-4 py-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[16px] text-white tabular-nums">
                        {actionLabel(p.action)} ·{" "}
                        {formatTime(p.client_time, tz)}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {formatDayLabel(p.client_time, tz)}
                      </p>
                    </div>
                    <span className="rounded-full border border-gold-500/30 px-2 py-0.5 font-bold text-[10px] text-gold-500 uppercase tracking-[0.08em]">
                      Pendiente
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {fromCache && !online && (
            <p className="mb-4 flex items-center gap-2 text-[12px] text-warn">
              <CloudOff className="size-3.5" /> Sin conexión: mostrando lo
              último que se cargó.
            </p>
          )}
          {error ? (
            <p
              className={`py-10 text-center text-sm ${online ? "text-bad" : "text-muted"}`}
            >
              {error}
            </p>
          ) : !records ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted" />
            </div>
          ) : records.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">
              Sin registros en los últimos {days} días.
            </p>
          ) : (
            <ol className="space-y-5">
              {groups.map((g) => (
                <li key={g.key} className="animate-rise">
                  <div className="mb-2 flex items-baseline justify-between">
                    <h2 className="font-bold text-[13px] text-white">
                      {g.label}
                    </h2>
                    <span className="font-bold text-[12px] text-muted tabular-nums">
                      {formatHours(g.total)}
                    </span>
                  </div>
                  <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-ink-850/60">
                    {g.items.map((r) => (
                      <Row key={r.id} record={r} tz={tz} />
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}

function Row({ record: r, tz }: { record: HistoryRecord; tz?: string }) {
  const badges = [r.in_geofence_state, r.out_geofence_state]
    .map((s) => (s ? GEO_BADGE[s] : undefined))
    .filter(
      (b, i, arr): b is { label: string; cls: string } =>
        Boolean(b) && arr.indexOf(b) === i,
    );
  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 font-extrabold text-[16px] text-white tabular-nums">
          {formatTime(r.check_in, tz)}
          <ArrowRight className="size-3.5 text-subtle" />
          {r.check_out ? (
            formatTime(r.check_out, tz)
          ) : (
            <span className="font-bold text-[13px] text-ok">En curso</span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {badges.map((b) => (
            <span
              key={b.label}
              className={`rounded-full border px-2 py-0.5 font-bold text-[10px] uppercase tracking-[0.08em] ${b.cls}`}
            >
              {b.label}
            </span>
          ))}
          {r.out_reason === "lunch" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-warn/25 bg-warn/10 px-2 py-0.5 font-bold text-[10px] text-warn uppercase tracking-[0.08em]">
              <Utensils className="size-3" /> Comida
            </span>
          )}
          {r.out_reason && r.out_reason !== "lunch" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-warn/25 bg-warn/10 px-2 py-0.5 font-bold text-[10px] text-warn uppercase tracking-[0.08em]">
              <DoorOpen className="size-3" /> Salida:{" "}
              {r.out_reason_label ?? r.out_reason}
              {r.out_reason_note ? `: ${r.out_reason_note}` : ""}
            </span>
          )}
          {r.auto_closed && (
            <span className="rounded-full border border-bad/30 bg-bad/10 px-2 py-0.5 font-bold text-[10px] text-bad uppercase tracking-[0.08em]">
              Sin salida · cierre 23:59
            </span>
          )}
          {r.review_state === "to_review" && (
            <span className="rounded-full border border-warn/25 bg-warn/10 px-2 py-0.5 font-bold text-[10px] text-warn uppercase tracking-[0.08em]">
              Por revisión
            </span>
          )}
          {(r.in_offline || r.out_offline) && (
            <span className="inline-flex items-center gap-1 rounded-full border border-warn/25 bg-warn/10 px-2 py-0.5 font-bold text-[10px] text-warn uppercase tracking-[0.08em]">
              <CloudOff className="size-3" /> Sin conexión
            </span>
          )}
          {(r.in_selfie || r.out_selfie) && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
              <Camera className="size-3" /> Selfie
            </span>
          )}
        </div>
      </div>
      <span className="font-bold text-[14px] text-gold-500 tabular-nums">
        {r.check_out ? formatHours(r.worked_hours) : "—"}
      </span>
    </li>
  );
}
