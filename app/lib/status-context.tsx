"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "./api";
import type { Status } from "./types";

type StatusContextValue = {
  status: Status | null;
  /** Momento (ms del cliente) en que llegó `status`; base del contador en vivo. */
  receivedAt: number;
  error: string;
  refresh: () => Promise<void>;
  setStatus: (status: Status) => void;
};

const StatusContext = createContext<StatusContextValue | null>(null);

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatusState] = useState<Status | null>(null);
  const [receivedAt, setReceivedAt] = useState(0);
  const [error, setError] = useState("");

  const setStatus = useCallback((next: Status) => {
    setStatusState(next);
    setReceivedAt(Date.now());
    setError("");
  }, []);

  const refresh = useCallback(async () => {
    try {
      setStatus(await apiFetch<Status>("/status"));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar tu información.",
      );
    }
  }, [setStatus]);

  useEffect(() => {
    refresh();
    // Al volver a la app (otra pestaña, otro dispositivo, cambio de día)
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const value = useMemo(
    () => ({ status, receivedAt, error, refresh, setStatus }),
    [status, receivedAt, error, refresh, setStatus],
  );
  return (
    <StatusContext.Provider value={value}>{children}</StatusContext.Provider>
  );
}

export function useStatus() {
  const ctx = useContext(StatusContext);
  if (!ctx) throw new Error("useStatus debe usarse dentro de <StatusProvider>");
  return ctx;
}
