"use client";

import { Camera, Check, Loader2, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cameraErrorMessage, captureFrame } from "../lib/device";

type Props = {
  title: string;
  onCancel: () => void;
  onConfirm: (photo: string) => void;
};

/**
 * Selfie en vivo con la cámara frontal. Solo cámara: no hay opción de subir
 * un archivo de la galería (Odoo la exige como evidencia de identidad).
 */
export function SelfieCamera({ title, onCancel, onConfirm }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  const stop = useCallback(() => {
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError("");
    setReady(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new DOMException("", "SecurityError");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch (err) {
      setError(cameraErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  // Bloquea el scroll del fondo y permite cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const take = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    try {
      setPhoto(captureFrame(video));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo tomar la foto.",
      );
    }
  };

  const confirm = () => {
    if (!photo) return;
    stop();
    onConfirm(photo);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center"
    >
      <div className="pb-safe w-full max-w-[440px] animate-sheet rounded-t-[28px] border border-line bg-ink-900 sm:rounded-[28px]">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <p className="eyebrow text-gold-500">Selfie</p>
            <h2 className="font-extrabold text-lg text-white">{title}</h2>
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

        <div className="px-5 pt-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-line bg-ink-950">
            {/* El video sigue montado debajo de la foto para poder repetirla */}
            <video
              ref={videoRef}
              playsInline
              muted
              onLoadedData={() => setReady(true)}
              className="size-full -scale-x-100 object-cover"
            />
            {photo && (
              // biome-ignore lint/performance/noImgElement: vista previa de un data URL local
              <img
                src={photo}
                alt="Tu selfie"
                className="absolute inset-0 size-full object-cover"
              />
            )}
            {!ready && !error && !photo && (
              <div className="absolute inset-0 flex items-center justify-center text-muted">
                <Loader2 className="size-6 animate-spin" />
              </div>
            )}
            {!photo && ready && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-[12%] rounded-[50%] border-2 border-gold-500/40 border-dashed"
              />
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <Camera className="size-8 text-muted" />
                <p className="text-sm text-white/80">{error}</p>
                <button
                  type="button"
                  onClick={start}
                  className="rounded-xl border border-line px-4 py-2 font-bold text-[12px] text-gold-500 uppercase tracking-[0.14em]"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-[12px] text-muted">
            Centra tu rostro con buena luz. La foto se guarda como evidencia de
            tu registro.
          </p>
        </div>

        <div className="flex gap-3 p-5">
          {photo ? (
            <>
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl border border-line font-bold text-[13px] text-white uppercase tracking-[0.12em]"
              >
                <RotateCcw className="size-4" /> Repetir
              </button>
              <button
                type="button"
                onClick={confirm}
                className="btn-gold flex h-[52px] flex-[1.4] items-center justify-center gap-2 rounded-2xl text-[13px]"
              >
                <Check className="size-4" strokeWidth={3} /> Usar foto
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={take}
              disabled={!ready || Boolean(error)}
              className="btn-gold flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[13px] disabled:opacity-40 disabled:shadow-none"
            >
              <Camera className="size-4" /> Tomar foto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
