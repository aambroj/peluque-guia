import type { Metadata } from "next";
import RegistroPageClient from "./RegistroPageClient";

export const metadata: Metadata = {
  title: "Crear negocio | PeluqueGuía",
  description:
    "Registra tu peluquería en PeluqueGuía y empieza a gestionar reservas, clientes, empleados, servicios y reserva online desde un panel profesional, claro y preparado para crecer.",
  alternates: {
    canonical: "/registro",
  },
  openGraph: {
    title: "Crear negocio | PeluqueGuía",
    description:
      "Registra tu peluquería en PeluqueGuía y empieza a gestionar reservas, clientes, empleados, servicios y reserva online desde un panel profesional, claro y preparado para crecer.",
    url: "/registro",
  },
  twitter: {
    title: "Crear negocio | PeluqueGuía",
    description:
      "Registra tu peluquería en PeluqueGuía y empieza a gestionar reservas, clientes, empleados, servicios y reserva online desde un panel profesional, claro y preparado para crecer.",
  },
};

export default function RegistroPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fffaf7_0%,#fff7f3_24%,#fcf4f6_64%,#fffaf7_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(234,214,214,0.72),transparent_30%),radial-gradient(circle_at_top_right,rgba(221,214,243,0.42),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(248,235,232,0.92),transparent_28%)]" />
      <div className="relative">
        <RegistroPageClient />
      </div>
    </main>
  );
}