// Cliente único para la API REST de `wispi_attendance` (`/api/attendance/*`).
//
// Mismo patrón que el portal de vendedores: el navegador llama a este mismo
// origen y `next.config.ts` reenvía a Odoo. Para que la petición sea "simple"
// (sin preflight CORS) no se usan cabeceras personalizadas: la sesión va en
// el query param `_sid` y el cuerpo se manda como `text/plain` con JSON.

export const API_BASE = "/api/attendance";

// No puede llamarse `session_id`: ese nombre lo usa Odoo con HttpOnly y, al
// ser same-origin por el rewrite, JS no podría borrarla al cerrar sesión.
// Duplicado a propósito en `proxy.ts`.
export const SESSION_COOKIE = "asist_sid";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días; Odoo decide si sigue viva

export function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`,
    ),
  );
  return match ? decodeURIComponent(match[1]) : "";
}

export function saveSession(sid: string) {
  // biome-ignore lint/suspicious/noDocumentCookie: cookie leída por proxy.ts
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(sid)}; path=/; max-age=${SESSION_MAX_AGE}; samesite=lax`;
}

export function clearSession() {
  if (typeof document === "undefined") return;
  // biome-ignore lint/suspicious/noDocumentCookie: cookie leída por proxy.ts
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  validation: boolean;
  data: unknown;

  constructor(message: string, status: number, data?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = typeof data?.code === "string" ? data.code : undefined;
    this.validation = Boolean(data?.validation_error);
    this.data = data;
  }
}

function expireSession() {
  clearSession();
  if (window.location.pathname !== "/") window.location.assign("/?expired=1");
}

type ApiOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
  /** false en el login: un 401 ahí es "contraseña incorrecta", no sesión expirada. */
  auth?: boolean;
  timeoutMs?: number;
};

export async function apiFetch<T>(
  path: string,
  {
    method = "POST",
    body,
    signal,
    auth = true,
    timeoutMs = 45_000,
  }: ApiOptions = {},
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  const sid = getCookie(SESSION_COOKIE);
  if (auth && sid) url.searchParams.set("_sid", sid);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const forwardAbort = () => controller.abort();
  signal?.addEventListener("abort", forwardAbort, { once: true });

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
      signal: controller.signal,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        "La solicitud tardó demasiado. Revisa tu conexión.",
        0,
      );
    }
    throw new ApiError("Sin conexión con el servidor. Revisa tu internet.", 0);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }

  if (auth && (res.status === 401 || res.status === 303)) {
    expireSession();
    throw new ApiError("Tu sesión expiró. Inicia sesión de nuevo.", res.status);
  }

  let data: Record<string, unknown> | null = null;
  try {
    data = await res.json();
  } catch {
    // Odoo responde HTML (login web) cuando la sesión ya no es válida
    if (auth && res.ok) {
      expireSession();
      throw new ApiError(
        "Tu sesión expiró. Inicia sesión de nuevo.",
        res.status,
      );
    }
  }

  if (!data)
    throw new ApiError(
      `Error de comunicación con Odoo (${res.status}).`,
      res.status,
    );
  if (!res.ok || data.success === false) {
    const message =
      typeof data.message === "string"
        ? data.message
        : "Operación rechazada por Odoo.";
    throw new ApiError(message, res.status, data);
  }
  return data as T;
}
