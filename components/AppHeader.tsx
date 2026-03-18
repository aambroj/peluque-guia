"use client";

import { usePathname } from "next/navigation";

function getHeaderData(pathname: string) {
  if (pathname.startsWith("/dashboard")) {
    return {
      title: "Dashboard",
      subtitle: "Resumen general del negocio",
    };
  }

  if (pathname.startsWith("/reservas")) {
    return {
      title: "Reservas",
      subtitle: "Gestiona la agenda y las citas",
    };
  }

  if (pathname.startsWith("/clientes")) {
    return {
      title: "Clientes",
      subtitle: "Consulta y edita fichas de clientes",
    };
  }

  if (pathname.startsWith("/empleados")) {
    return {
      title: "Empleados",
      subtitle: "Gestiona equipo, horarios y bloqueos",
    };
  }

  if (pathname.startsWith("/servicios")) {
    return {
      title: "Servicios",
      subtitle: "Edita catálogo, precios y duración",
    };
  }

  if (pathname.startsWith("/reservar")) {
    return {
      title: "Reserva pública",
      subtitle: "Flujo online para clientes",
    };
  }

  return {
    title: "Panel de gestión",
    subtitle: "Administra tu peluquería desde un solo lugar",
  };
}

export default function AppHeader() {
  const pathname = usePathname();
  const { title, subtitle } = getHeaderData(pathname);

  return (
    <header className="border-b border-zinc-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-sm text-zinc-500">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}