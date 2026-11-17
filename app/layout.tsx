import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Control de Asistencia · Wispi XCIEN",
  description: "Registro de entrada y salida de la jornada laboral.",
  icons: { icon: "/wispi-logo.png", apple: "/wispi-logo.png" },
  appleWebApp: {
    capable: true,
    title: "Asistencia",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#131418",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-MX" className={inter.variable}>
      <body className="min-h-dvh bg-ink-900 font-sans antialiased">
        <div className="relative flex min-h-dvh flex-col">{children}</div>
      </body>
    </html>
  );
}
