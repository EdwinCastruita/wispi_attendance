// Service worker de la app de asistencia: permite abrirla sin señal.
//
// - Páginas (/inicio, /historial, /perfil): primero red; si no hay, la copia guardada.
// - Archivos estáticos de Next (/_next/static, /_next/image) e íconos: primero caché.
// - Nunca se guarda nada de /api/*: los registros sin conexión van en IndexedDB
//   (app/lib/offline-queue.ts), no aquí.
//
// Sube VERSION si cambias este archivo para forzar la actualización.

const VERSION = "asist-v1";
const PAGES = ["/inicio", "/historial", "/perfil"];
const ASSETS = ["/wispi-logo.png", "/icon-192.png", "/icon-512.png"];
const STATIC_RE = /^\/_next\/(static|image)\b|\.(png|svg|ico|woff2?)$/;

async function precache() {
  const cache = await caches.open(VERSION);
  await cache.addAll(ASSETS).catch(() => undefined);
  for (const page of PAGES) {
    try {
      // `manual`: si no hay sesión, Next redirige al login y eso no se guarda
      const res = await fetch(page, {
        credentials: "include",
        redirect: "manual",
      });
      if (!res.ok || res.type !== "basic") continue;
      await cache.put(page, res.clone());
      // Los chunks de JS/CSS que usa la página, para que arranque sin red
      const html = await res.text();
      const assets = [
        ...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || []),
      ];
      await Promise.all(assets.map((a) => cache.add(a).catch(() => undefined)));
    } catch {
      // sin red durante la instalación: se llenará al navegar
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/"))
    return;

  if (STATIC_RE.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res.ok && res.type === "basic" && PAGES.includes(url.pathname)) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(url.pathname, copy));
          }
          return res;
        } catch {
          const cache = await caches.open(VERSION);
          return (
            (await cache.match(url.pathname)) ||
            (await cache.match("/inicio")) ||
            Response.error()
          );
        }
      })(),
    );
  }
});
