import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Peluque-Guía",
  description: "Software web para peluquerías",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-zinc-100 text-black">
        <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
          <Sidebar />

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