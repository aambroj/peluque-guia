"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reservas", label: "Reservas" },
  { href: "/servicios", label: "Servicios" },
  { href: "/clientes", label: "Clientes" },
  { href: "/empleados", label: "Empleados" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-6 py-6">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Peluque-Guía
        </Link>
        <p className="mt-2 text-sm text-zinc-500">
          Gestión completa para peluquerías
        </p>
      </div>

      <nav className="flex flex-col gap-2 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-black text-white shadow-sm"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-black"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}