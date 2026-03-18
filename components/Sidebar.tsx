"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

type NavItem = {
  href: string;
  label: string;
  description: string;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Resumen del negocio",
  },
  {
    href: "/reservas",
    label: "Reservas",
    description: "Agenda y citas",
  },
  {
    href: "/clientes",
    label: "Clientes",
    description: "Fichas y datos",
  },
  {
    href: "/empleados",
    label: "Empleados",
    description: "Equipo, horarios y bloqueos",
  },
  {
    href: "/servicios",
    label: "Servicios",
    description: "Precios y duración",
  },
  {
    href: "/reservar",
    label: "Reserva pública",
    description: "Flujo online para clientes",
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-r border-zinc-200 bg-white">
      <div className="sticky top-0 flex h-full min-h-screen flex-col">
        <div className="border-b border-zinc-200 px-6 py-6">
          <Link href="/dashboard" className="block">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Peluque-Guía
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-900">
              Panel de gestión
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Todo el negocio en un solo lugar
            </p>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-5">
          <div className="space-y-2">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl border px-4 py-4 transition ${
                    active
                      ? "border-black bg-black text-white shadow-sm"
                      : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      active ? "text-white" : "text-zinc-900"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      active ? "text-zinc-200" : "text-zinc-500"
                    }`}
                  >
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-zinc-200 px-4 py-5 space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-900">
              Acceso rápido
            </p>
            <div className="mt-3 grid gap-2">
              <Link
                href="/reservas/nuevo"
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:border-black"
              >
                Nueva reserva
              </Link>
              <Link
                href="/clientes/nuevo"
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:border-black"
              >
                Nuevo cliente
              </Link>
              <Link
                href="/empleados/nuevo"
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:border-black"
              >
                Nuevo empleado
              </Link>
            </div>
          </div>

          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}