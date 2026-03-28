import type { Metadata } from "next";
import RegistroPageClient from "./RegistroPageClient";

export const metadata: Metadata = {
  title: "Crear negocio",
  description:
    "Registra tu peluquería en Peluque-Guía y empieza a gestionar reservas, clientes, empleados, servicios y reserva online desde un solo panel.",
  alternates: {
    canonical: "/registro",
  },
  openGraph: {
    title: "Crear negocio | Peluque-Guía",
    description:
      "Registra tu peluquería en Peluque-Guía y empieza a gestionar reservas, clientes, empleados, servicios y reserva online desde un solo panel.",
    url: "/registro",
  },
  twitter: {
    title: "Crear negocio | Peluque-Guía",
    description:
      "Registra tu peluquería en Peluque-Guía y empieza a gestionar reservas, clientes, empleados, servicios y reserva online desde un solo panel.",
  },
};

export default function RegistroPage() {
  return <RegistroPageClient />;
}