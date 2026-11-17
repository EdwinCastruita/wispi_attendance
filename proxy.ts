import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Debe coincidir con `SESSION_COOKIE` de `app/lib/api.ts`.
const SESSION_COOKIE = "asist_sid";

const PROTECTED = ["/inicio", "/historial", "/perfil"];

/**
 * Guard de sesión:
 *  - sin cookie en una ruta protegida -> `/` (login)
 *  - con cookie en `/`                -> `/inicio`
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (pathname === "/" && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/inicio";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
