import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Entrar | Peluque-Guía",
  description:
    "Accede a Peluque-Guía para gestionar reservas, clientes, empleados, servicios y la operativa diaria de tu peluquería desde un panel profesional y claro.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Entrar | Peluque-Guía",
    description:
      "Accede a Peluque-Guía para gestionar reservas, clientes, empleados, servicios y la operativa diaria de tu peluquería desde un panel profesional y claro.",
    url: "/login",
  },
  twitter: {
    title: "Entrar | Peluque-Guía",
    description:
      "Accede a Peluque-Guía para gestionar reservas, clientes, empleados, servicios y la operativa diaria de tu peluquería desde un panel profesional y claro.",
  },
};

function LoginPageFallback() {
  return (
    <section className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden rounded-[2rem] border border-zinc-200 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-10 text-white shadow-sm lg:block">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-white/70">
                Peluque-Guía
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight">
                Accede a tu panel de gestión
              </h1>
              <p className="mt-4 text-base leading-7 text-zinc-300">
                Controla reservas, clientes, empleados, servicios y la operativa
                diaria de tu salón desde una herramienta más ordenada, moderna y
                profesional.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
                  Agenda y reservas
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
                  Clientes y equipo
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
                  Servicios y precios
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
                  Reserva online
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
              <div className="animate-pulse">
                <div className="h-4 w-24 rounded bg-zinc-200" />
                <div className="mt-4 h-9 w-56 rounded bg-zinc-200" />
                <div className="mt-3 h-4 w-full rounded bg-zinc-100" />
                <div className="mt-8 h-12 w-full rounded-2xl bg-zinc-100" />
                <div className="mt-4 h-12 w-full rounded-2xl bg-zinc-100" />
                <div className="mt-6 h-12 w-full rounded-2xl bg-zinc-200" />
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