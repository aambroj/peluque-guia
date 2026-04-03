import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Entrar | PeluqueGuía",
  description:
    "Accede a PeluqueGuía para gestionar reservas, clientes, empleados, servicios y la operativa diaria de tu peluquería desde un panel profesional y claro.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Entrar | PeluqueGuía",
    description:
      "Accede a PeluqueGuía para gestionar reservas, clientes, empleados, servicios y la operativa diaria de tu peluquería desde un panel profesional y claro.",
    url: "/login",
  },
  twitter: {
    title: "Entrar | PeluqueGuía",
    description:
      "Accede a PeluqueGuía para gestionar reservas, clientes, empleados, servicios y la operativa diaria de tu peluquería desde un panel profesional y claro.",
  },
};

function LoginPageFallback() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fffaf7_0%,#fff7f3_24%,#fcf4f6_64%,#fffaf7_100%)] px-6 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(234,214,214,0.72),transparent_30%),radial-gradient(circle_at_top_right,rgba(221,214,243,0.42),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(248,235,232,0.92),transparent_28%)]" />

      <div className="relative mx-auto flex min-h-[80vh] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden rounded-[2rem] border border-white/50 bg-[linear-gradient(135deg,#6f3a52_0%,#86506a_52%,#a16b82_100%)] p-10 text-white shadow-[0_26px_80px_rgba(87,45,65,0.22)] lg:block">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-white/75">PeluqueGuía</p>

              <h1 className="mt-4 text-4xl font-bold tracking-tight">
                Accede a tu panel de gestión
              </h1>

              <p className="mt-4 text-base leading-7 text-white/80">
                Controla reservas, clientes, empleados, servicios y la operativa
                diaria de tu salón desde una herramienta más ordenada, moderna y
                profesional.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur-sm">
                  Agenda y reservas
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur-sm">
                  Clientes y equipo
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur-sm">
                  Servicios y precios
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur-sm">
                  Reserva online
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-sm font-medium text-white/75">
                  Pensado para el día a día del salón
                </p>
                <p className="mt-2 text-sm leading-7 text-white/85">
                  Una entrada más cuidada, más cálida y con una imagen de marca
                  más profesional desde el primer vistazo.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-[2rem] border border-white/70 bg-white/82 p-8 shadow-[0_24px_80px_rgba(87,45,65,0.12)] backdrop-blur sm:p-10">
              <div className="animate-pulse">
                <div className="h-4 w-24 rounded bg-[#e9d8da]" />
                <div className="mt-4 h-9 w-56 rounded bg-[#e4d2d6]" />
                <div className="mt-3 h-4 w-full rounded bg-[#f4eaeb]" />
                <div className="mt-8 h-12 w-full rounded-2xl bg-[#f7eeef]" />
                <div className="mt-4 h-12 w-full rounded-2xl bg-[#f7eeef]" />
                <div className="mt-6 h-12 w-full rounded-2xl bg-[#e6d3d7]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageClient />
    </Suspense>
  );
}