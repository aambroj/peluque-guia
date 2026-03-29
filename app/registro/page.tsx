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
  return <RegistroPageClient />;
}