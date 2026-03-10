import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peluque-Guía",
  description: "Software web para peluquerías",
};

const menuItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reservas", label: "Reservas" },
  { href: "/servicios", label: "Servicios" },
  { href: "/clientes", label: "Clientes" },
  { href: "/empleados", label: "Empleados" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-zinc-100 text-black">
        <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
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
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-black"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="flex min-h-screen flex-col">
            <header className="border-b border-zinc-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold">Panel de gestión</h1>
                  <p className="text-sm text-zinc-500">
                    Administra tu peluquería desde un solo lugar
                  </p>
                </div>

                <div className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
                  Demo
                </div>
              </div>
            </header>

            <main className="flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}