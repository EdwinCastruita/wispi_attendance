import type { NextConfig } from "next";

// Host de Odoo, sin ruta. Solo lo usa el servidor de Next (rewrites).
const ODOO_URL = (process.env.ODOO_URL ?? "https://qa.wispi.cloud").replace(
  /\/+$/,
  "",
);

const nextConfig: NextConfig = {
  experimental: {
    // Las selfies viajan en base64 dentro del JSON (máx. 1.5 MB en Odoo).
    proxyClientMaxBodySize: 4 * 1024 * 1024,
  },
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    // Proxy same-origin: el navegador llama a /api/attendance/* en este
    // origen y Next lo reenvía a Odoo. Sin CORS ni preflight.
    return [
      {
        source: "/api/attendance/:path*",
        destination: `${ODOO_URL}/api/attendance/:path*`,
      },
    ];
  },
};

export default nextConfig;
