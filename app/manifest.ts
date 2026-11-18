import type { MetadataRoute } from "next";

// Permite instalar la app en la pantalla de inicio del celular.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Control de Asistencia · Wispi XCIEN",
    short_name: "Asistencia",
    description: "Registro de entrada y salida de la jornada laboral.",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#131418",
    theme_color: "#131418",
    lang: "es-MX",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
