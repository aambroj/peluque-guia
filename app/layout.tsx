import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PeluqueGuía",
    template: "%s | PeluqueGuía",
  },
  description:
    "Software web para peluquerías: reservas, clientes, empleados, servicios y gestión del negocio en un solo panel.",
  applicationName: "PeluqueGuía",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}