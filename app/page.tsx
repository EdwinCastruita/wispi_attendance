"use client";

import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Brand } from "./components/Brand";
import { Waves } from "./components/Waves";
import { ApiError, apiFetch, saveSession } from "./lib/api";
import { saveCachedStatus } from "./lib/offline-cache";
import type { Status } from "./lib/types";

type LoginResponse = Status & {
  success: true;
  session_id: string;
  uid: number;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("expired")) {
      setError("Tu sesión expiró. Inicia sesión para continuar.");
    }
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
    };
  }, []);

  const togglePassword = () => {
    // Se vuelve a ocultar sola para no dejarla visible en pantalla
    setShowPassword((v) => !v);
    if (showTimer.current) clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => setShowPassword(false), 2500);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<LoginResponse>("/login", {
        body: { login: email.trim(), password },
        auth: false,
      });
      saveSession(data.session_id);
      saveCachedStatus(data, Date.now());
      router.replace("/inicio");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Correo o contraseña incorrectos.");
      } else if (err instanceof ApiError && err.code === "no_employee") {
        setError(
          "Tu usuario no está ligado a un empleado. Pide a Recursos Humanos que lo vincule.",
        );
      } else {
        setError(
          err instanceof Error ? err.message : "No se pudo iniciar sesión.",
        );
      }
      setLoading(false);
    }
  };

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl"
      />
      <Waves className="bottom-24 h-40 opacity-70 md:bottom-16 md:h-56" />

      <div className="relative z-10 w-full max-w-[440px] animate-rise">
        <div className="overflow-hidden rounded-[28px] border border-line bg-ink-900/95 shadow-[0_30px_80px_rgb(0_0_0/0.5)] backdrop-blur">
          <div className="h-[3px] w-full bg-gradient-to-r from-gold-600 via-gold-500/70 to-transparent" />
          <div className="px-6 pt-8 pb-7">
            <Brand subtitle="Control de asistencia" size={44} />

            <h1 className="mt-8 font-extrabold text-[28px] text-white tracking-tight">
              Iniciar sesión
            </h1>
            <p className="mt-2 text-[15px] text-white/70 leading-relaxed">
              Ingresa con tu cuenta de Odoo para registrar tu entrada y salida.
            </p>

            <form className="mt-7 space-y-5" onSubmit={submit} noValidate>
              <label className="block">
                <span className="eyebrow">Correo</span>
                <div className="relative mt-2">
                  <Mail className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
                  <input
                    required
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    className="field"
                  />
                </div>
              </label>

              <label className="block">
                <span className="eyebrow">Contraseña</span>
                <div className="relative mt-2">
                  <Lock className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    className="field pr-12"
                  />
                  <button
                    type="button"
                    onClick={togglePassword}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-xl text-muted transition-colors hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </label>

              {error && (
                <div
                  role="alert"
                  className="flex gap-3 rounded-2xl border border-bad/25 bg-bad/10 px-4 py-3 text-[13px] text-bad leading-snug"
                >
                  <span className="w-[3px] shrink-0 self-stretch rounded-full bg-bad" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="btn-gold flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[14px] transition active:scale-[0.99] disabled:opacity-45 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Entrando…
                  </>
                ) : (
                  <>
                    Entrar <ArrowRight className="size-4" strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-[12px] text-white/55">
              Necesitas conexión para iniciar sesión. Después puedes registrar
              aunque no tengas señal.
              <br />
              ¿Problemas para acceder? Contacta a tu gerente de zona.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center font-bold text-[10px] text-subtle uppercase tracking-[0.24em]">
          Conexión segura · Portal v1.0
        </p>
      </div>
    </main>
  );
}
