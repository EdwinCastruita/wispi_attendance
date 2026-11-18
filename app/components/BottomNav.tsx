"use client";

import { CalendarDays, Clock, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStatus } from "../lib/status-context";
import { Brand } from "./Brand";
import { Avatar, OfflinePill } from "./TopBar";

const ITEMS = [
  { href: "/inicio", label: "Inicio", Icon: Clock },
  { href: "/historial", label: "Historial", Icon: CalendarDays },
  { href: "/perfil", label: "Perfil", Icon: UserRound },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Navegación inferior: celular y tablet (< lg). */
export function BottomNav() {
  const isActive = useIsActive();
  return (
    <nav className="pb-safe sticky bottom-0 z-20 border-line border-t bg-ink-950/90 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-3">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-[68px] flex-col items-center justify-center gap-1.5 font-extrabold text-[11px] uppercase tracking-[0.12em] transition-colors ${
                  active ? "text-gold-500" : "text-muted hover:text-white"
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Barra lateral fija: PC (≥ lg). */
export function SideNav() {
  const isActive = useIsActive();
  const { status } = useStatus();
  const employee = status?.employee;
  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-line border-r bg-ink-950/60 px-5 py-7 lg:flex">
      <Brand subtitle="Control de asistencia" size={36} />
      <div className="mt-5 empty:hidden">
        <OfflinePill />
      </div>
      <nav className="mt-10">
        <ul className="space-y-1.5">
          {ITEMS.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-12 items-center gap-3 rounded-xl border px-4 font-extrabold text-[12px] uppercase tracking-[0.12em] transition-colors ${
                    active
                      ? "border-gold-500/25 bg-gold-500/10 text-gold-500"
                      : "border-transparent text-muted hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <Icon
                    className="size-[18px]"
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {employee && (
        <Link
          href="/perfil"
          className="mt-auto flex items-center gap-3 rounded-2xl border border-line bg-ink-850/60 p-3 transition-colors hover:border-gold-500/30"
        >
          <Avatar employee={employee} size={40} />
          <span className="min-w-0">
            <span className="block truncate font-bold text-[13px] text-white">
              {employee.name}
            </span>
            <span className="block truncate text-[11px] text-muted">
              {employee.job_title || employee.login}
            </span>
          </span>
        </Link>
      )}
    </aside>
  );
}
