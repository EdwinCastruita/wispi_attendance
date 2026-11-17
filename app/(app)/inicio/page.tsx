"use client";

import { Loader2, LogIn, LogOut, MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Notice, type NoticeData } from "../../components/Notice";
import { SelfieCamera } from "../../components/SelfieCamera";
import { TopBar } from "../../components/TopBar";
import { Waves } from "../../components/Waves";
import { ApiError, apiFetch } from "../../lib/api";
import { type Coords, getPosition } from "../../lib/device";
import {
  firstName,
  formatHours,
  formatLongDate,
  formatTime,
  greeting,
} from "../../lib/format";
import { useStatus } from "../../lib/status-context";
import type { PunchResponse, Status } from "../../lib/types";

type Step = "idle" | "camera" | "locating" | "sending";

export default function InicioPage() {
  const { status, receivedAt, error, refresh, setStatus } = useStatus();
  const [now, setNow] = useState(() => Date.now());
  const [step, setStep] = useState<Step>("idle");
  const [notice, setNotice] = useState<NoticeData | null>(null);
  // La ubicación se pide al pulsar el botón, en paralelo con la selfie
  const positionRef = useRef<Promise<Coords | null> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const tz = status?.employee.tz;
  const checkedIn = status?.next_action === "check_out";
  const action = status?.next_action ?? "check_in";
  const busy = step !== "idle";

  // Horas en vivo: lo que dijo Odoo + lo transcurrido desde entonces si sigue en turno
  const workedHours = status
    ? status.worked_hours_today +
      (checkedIn ? Math.max(0, now - receivedAt) / 3_600_000 : 0)
    : 0;

  const send = useCallback(
    async (photo: string | null) => {
      if (!status) return;
      setStep("locating");
      const coords = await (positionRef.current ?? Promise.resolve(null));
      setStep("sending");
      try {
        const res = await apiFetch<PunchResponse>("/punch", {
          body: {
            action,
            latitude: coords?.latitude ?? null,
            longitude: coords?.longitude ?? null,
            photo,
          },
        });
        setStatus(res);
        const hour = formatTime(res.time, res.employee.tz);
        const label =
          res.action_done === "check_in"
            ? "Entrada registrada"
            : "Salida registrada";
        setNotice(
          res.feedback
            ? {
                ...res.feedback,
                title: `${label} · ${hour}`,
                message: `${res.feedback.title}. ${res.feedback.message}`,
                sticky: res.feedback.type !== "success",
              }
            : { type: "success", title: `${label} · ${hour}` },
        );
      } catch (err) {
        if (err instanceof ApiError && err.code === "state_mismatch") {
          // Ya se había registrado (doble toque u otro dispositivo): se refresca la pantalla
          setStatus(err.data as Status);
          setNotice({
            type: "info",
            title: "Tu registro ya estaba actualizado",
            message: err.message,
          });
        } else {
          setNotice({
            type: "danger",
            title: "No se registró",
            message: err instanceof Error ? err.message : "Inténtalo de nuevo.",
            sticky: true,
          });
        }
      } finally {
        positionRef.current = null;
        setStep("idle");
      }
    },
    [action, status, setStatus],
  );

  const start = () => {
    if (!status || busy) return;
    setNotice(null);
    positionRef.current = status.gps_required
      ? getPosition()
      : Promise.resolve(null);
    if (status.require_selfie) setStep("camera");
    else send(null);
  };

  const cancelCamera = useCallback(() => {
    positionRef.current = null;
    setStep("idle");
  }, []);

  const closeNotice = useCallback(() => setNotice(null), []);

  if (!status) {
    return (
      <>
        <TopBar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          {error ? (
            <>
              <p className="text-sm text-white/75">{error}</p>
              <button
                type="button"
                onClick={refresh}
                className="rounded-xl border border-line px-4 py-2 font-bold text-[12px] text-gold-500 uppercase tracking-[0.14em]"
              >
                Reintentar
              </button>
            </>
          ) : (
            <Loader2 className="size-6 animate-spin text-muted" />
          )}
        </div>
      </>
    );
  }

  const entrada = formatTime(status.today.first_check_in, tz);
  const salida = formatTime(status.today.last_check_out, tz);
  const busyLabel =
    step === "locating"
      ? "Ubicando…"
      : step === "sending"
        ? "Registrando…"
        : null;

  return (
    <>
      <TopBar employee={status.employee} />
      <Waves className="top-[64%] h-44 md:h-56 lg:top-auto lg:bottom-0 lg:h-64" />

      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pt-8 pb-6 md:px-10 md:pt-12 lg:max-w-6xl lg:px-12 lg:pt-14">
        <p className="eyebrow">{formatLongDate(new Date(now), tz)}</p>
        <h1 className="mt-1.5 font-extrabold text-[28px] text-white leading-tight tracking-tight md:text-[36px] lg:text-[40px]">
          {greeting(tz)}, {firstName(status.employee.name)}
        </h1>

        <div className="lg:mt-12 lg:grid lg:grid-cols-2 lg:items-center lg:gap-14">
          {/* Columna del botón */}
          <div className="flex flex-col items-center lg:rounded-[28px] lg:border lg:border-line lg:bg-ink-850/40 lg:px-8 lg:py-10">
            <div className="mt-7 flex justify-center lg:mt-0">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-bold text-[12px] uppercase tracking-[0.1em] ${
                  checkedIn
                    ? "border-ok/30 bg-ok/10 text-ok"
                    : "border-line bg-ink-800 text-white/75"
                }`}
              >
                <span className="relative flex size-2">
                  {checkedIn && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-ok opacity-70" />
                  )}
                  <span
                    className={`relative size-2 rounded-full ${checkedIn ? "bg-ok" : "bg-subtle"}`}
                  />
                </span>
                {checkedIn
                  ? `En turno desde ${formatTime(status.check_in, tz)}`
                  : "Fuera de turno"}
              </span>
            </div>

            {/* Botón principal */}
            <div className="relative mx-auto mt-7 flex size-[220px] items-center justify-center md:size-[260px]">
              <div
                aria-hidden
                className={`absolute inset-0 rounded-full blur-2xl ${checkedIn ? "bg-gold-500/10" : "bg-gold-500/20"}`}
              />
              {!busy && (
                <span
                  aria-hidden
                  className="absolute inset-[22px] animate-pulse-ring rounded-full border-2 border-gold-500/50"
                />
              )}
              <button
                type="button"
                onClick={start}
                disabled={busy}
                className={`relative flex size-[176px] flex-col md:size-[208px] items-center justify-center gap-3 rounded-full transition active:scale-[0.97] disabled:cursor-wait ${
                  checkedIn
                    ? "border-2 border-gold-500/70 bg-ink-850 text-gold-500 shadow-[0_0_60px_-10px_rgb(229_181_48/0.45),inset_0_0_40px_rgb(229_181_48/0.08)]"
                    : "gold-gradient text-ink-950 shadow-[0_20px_70px_-10px_rgb(229_181_48/0.6)]"
                }`}
              >
                {busyLabel ? (
                  <>
                    <Loader2 className="size-8 animate-spin" />
                    <span className="font-black text-[13px] uppercase tracking-[0.18em]">
                      {busyLabel}
                    </span>
                  </>
                ) : (
                  <>
                    {checkedIn ? (
                      <LogOut className="size-8" strokeWidth={2.2} />
                    ) : (
                      <LogIn className="size-8" strokeWidth={2.2} />
                    )}
                    <span className="font-black text-[17px] uppercase tracking-[0.16em]">
                      {checkedIn ? "Check out" : "Check in"}
                    </span>
                  </>
                )}
              </button>
            </div>

            <p className="mx-auto mt-4 flex max-w-[260px] items-start justify-center gap-1.5 text-center text-[13px] text-muted leading-snug">
              {status.gps_required && (
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
              )}
              Se registrará tu hora{status.gps_required ? " y ubicación" : ""}
              {status.require_selfie ? " con una selfie" : ""} al marcar{" "}
              {checkedIn ? "salida" : "entrada"}.
            </p>
          </div>

          {/* Columna del resumen */}
          <div className="flex flex-col">
            <p className="eyebrow mt-8 mb-3 hidden lg:mt-0 lg:block">
              Resumen de hoy
            </p>
            {notice && (
              <div className="mt-5 lg:order-last lg:mt-6">
                <Notice notice={notice} onClose={closeNotice} />
              </div>
            )}

            <dl className="mt-6 grid grid-cols-3 divide-x divide-line overflow-hidden rounded-2xl border border-line bg-ink-900/80 backdrop-blur lg:mt-0">
              <Stat label="Entrada" value={entrada} />
              <Stat label="Salida" value={salida} />
              <Stat label="Horas" value={formatHours(workedHours)} accent />
            </dl>

            <ul className="mt-6 hidden space-y-3 text-[13px] text-muted lg:block">
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                Marca tu entrada al iniciar la jornada y tu salida al
                terminarla.
              </li>
              {status.require_selfie && (
                <li className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                  Se pedirá una selfie con la cámara como evidencia de tu
                  registro.
                </li>
              )}
              {status.gps_required && (
                <li className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                  Permite el acceso a tu ubicación para validar dónde registras.
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {step === "camera" && (
        <SelfieCamera
          title={checkedIn ? "Registrar salida" : "Registrar entrada"}
          onCancel={cancelCamera}
          onConfirm={(photo) => send(photo)}
        />
      )}
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | null;
  accent?: boolean;
}) {
  return (
    <div className="px-4 py-3.5 md:px-5 md:py-4 lg:py-5">
      <dt className="eyebrow text-[10px]">{label}</dt>
      <dd
        className={`mt-1.5 font-extrabold text-[18px] tabular-nums md:text-[22px] ${
          accent
            ? "text-gold-500"
            : value
              ? "text-white"
              : "text-white/80 tracking-[0.2em]"
        }`}
      >
        {value ?? "--:--"}
      </dd>
    </div>
  );
}
