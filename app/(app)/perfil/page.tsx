"use client";

import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { Avatar, TopBar } from "../../components/TopBar";
import { apiFetch, clearSession } from "../../lib/api";
import { clearOfflineCache } from "../../lib/offline-cache";
import { clearQueue, listQueue } from "../../lib/offline-queue";
import { useStatus } from "../../lib/status-context";

const GEOFENCE_LABEL = {
  home: "Home office (se valida tu domicilio)",
  field: "Campo (se guarda tu GPS)",
  none: "Sin geocerca",
};

export default function PerfilPage() {
  const { status, pending, online, syncNow } = useStatus();
  const [leaving, setLeaving] = useState(false);
  const employee = status?.employee;

  const logout = async () => {
    setLeaving(true);
    // Los registros sin conexión viven solo en este celular: se intenta
    // enviarlos antes, y si no se puede se pide confirmación.
    if (pending.length && online) await syncNow();
    const left = (await listQueue()).filter(
      (p) => p.status === "pending",
    ).length;
    if (
      left &&
      !window.confirm(
        `Tienes ${left} registro(s) sin enviar a Odoo. Si cierras sesión se perderán. ¿Cerrar sesión de todos modos?`,
      )
    ) {
      setLeaving(false);
      return;
    }
    await clearQueue().catch(() => undefined);
    clearOfflineCache();
    try {
      await apiFetch("/logout", { timeoutMs: 8_000 });
    } catch {
      // Aunque Odoo no responda, la sesión local se cierra
    }
    clearSession();
    window.location.replace("/");
  };

  const rows: [string, string | undefined][] = employee
    ? [
        ["Usuario", employee.login],
        ["Puesto", employee.job_title],
        ["Departamento", employee.department],
        ["Jefe directo", employee.manager],
        ["Lugar de trabajo", employee.work_location],
        ["Empresa", employee.company_name],
        [
          "Tipo de acceso",
          employee.user_type === "portal"
            ? "Usuario portal"
            : "Usuario interno",
        ],
        ["Geocerca", status ? GEOFENCE_LABEL[status.geofence_mode] : undefined],
        ["Zona horaria", employee.tz],
      ]
    : [];

  return (
    <>
      <TopBar employee={employee} />
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pt-8 pb-6 md:px-10 md:pt-12 lg:max-w-5xl lg:px-12 lg:pt-14">
        {!employee ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted" />
          </div>
        ) : (
          <div className="flex flex-1 flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] md:items-start md:gap-10 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="flex flex-col md:sticky md:top-14 md:rounded-[28px] md:border md:border-line md:bg-ink-850/40 md:p-7">
              <div className="flex animate-rise flex-col items-center text-center">
                <Avatar employee={employee} size={88} />
                <h1 className="mt-4 font-extrabold text-[24px] text-white tracking-tight">
                  {employee.name}
                </h1>
                {employee.job_title && (
                  <p className="mt-1 text-[14px] text-muted">
                    {employee.job_title}
                  </p>
                )}
              </div>
              <LogoutButton
                className="mt-7 hidden md:flex"
                leaving={leaving}
                onClick={logout}
              />
            </div>

            <div className="flex flex-1 flex-col">
              <dl className="mt-7 md:mt-0 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-ink-850/60">
                {rows
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-start justify-between gap-4 px-4 py-3.5"
                    >
                      <dt className="eyebrow pt-0.5 text-[10px]">{label}</dt>
                      <dd className="min-w-0 break-words text-right text-[14px] text-white">
                        {value}
                      </dd>
                    </div>
                  ))}
              </dl>

              <div className="flex-1" />
              {status?.require_selfie && (
                <p className="mt-4 text-[12px] text-muted leading-relaxed">
                  Cada registro pide una selfie en vivo como evidencia de
                  identidad. Recursos Humanos la revisa; no se hace
                  reconocimiento facial.
                </p>
              )}

              <LogoutButton
                className="mt-6 flex md:hidden"
                leaving={leaving}
                onClick={logout}
              />
              <p className="mt-4 text-center font-bold text-[10px] text-subtle uppercase tracking-[0.24em] md:text-left">
                Control de asistencia · v1.0
              </p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function LogoutButton({
  className,
  leaving,
  onClick,
}: {
  className: string;
  leaving: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={leaving}
      className={`${className} h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-bad/30 bg-bad/10 font-bold text-[13px] text-bad uppercase tracking-[0.14em] transition hover:bg-bad/15 active:scale-[0.99] disabled:opacity-50`}
    >
      {leaving ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      Cerrar sesión
    </button>
  );
}
