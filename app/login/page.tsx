"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    window.location.href = redirectTo;
  }

  return (
    <section className="min-h-screen bg-zinc-50">
      <div className="mx-auto grid min-h-screen max-w-7xl items-stretch px-6 py-8 lg:grid-cols-[1.12fr_500px] lg:gap-8 lg:px-8">
        <div className="hidden lg:flex">
          <div className="flex w-full flex-col justify-between rounded-[2rem] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-10 text-white shadow-sm">
            <div>
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                Peluque-Guía · Software para peluquerías
              </div>

              <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight">
                Gestiona tu salón desde un panel claro, moderno y profesional.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
                Centraliza reservas, clientes, equipo, servicios y disponibilidad
                online en una sola herramienta. Diseñado para trabajar mejor hoy
                y crecer como negocio mañana.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold text-white">
                    Agenda más ordenada
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Gestiona citas, estados, cambios de última hora y reservas
                    públicas desde un único lugar.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold text-white">
                    Equipo y servicios
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Controla empleados, horarios, bloqueos, duración y precios
                    de cada servicio.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold text-white">
                    Métricas del negocio
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Consulta actividad, ingresos y seguimiento del salón desde
                    el dashboard.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold text-white">
                    Preparado para vender
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Base SaaS, multi-negocio y estructura profesional lista para
                    seguir creciendo.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold text-white">
                  Pensado para el día a día
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Menos tiempo organizando citas y más tiempo atendiendo bien a
                  tus clientes.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold text-white">
                  Soporte y contacto
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-medium text-white">Alberto Ambroj López</p>
                  <a
                    href="mailto:alber.ambroj@gmail.com"
                    className="block text-zinc-300 underline underline-offset-2 hover:text-white"
                  >
                    alber.ambroj@gmail.com
                  </a>
                  <a
                    href="mailto:aambroj@yahoo.es"
                    className="block text-zinc-300 underline underline-offset-2 hover:text-white"
                  >
                    aambroj@yahoo.es
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="mb-8">
              <p className="text-sm font-medium text-zinc-500">
                Acceso privado
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
                Entrar al panel
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Accede a tu cuenta para gestionar reservas, clientes, empleados,
                servicios y la operativa diaria de tu negocio.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="tuemail@negocio.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="••••••••"
                />
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-black px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">
                ¿Todavía no usas Peluque-Guía?
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Crea tu negocio y empieza a configurar tu salón.
              </p>
              <div className="mt-3">
                <Link
                  href="/registro"
                  className="text-sm font-medium text-black underline underline-offset-2"
                >
                  Crear negocio
                </Link>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 lg:hidden">
              <p className="text-sm font-semibold text-zinc-900">
                Soporte y contacto
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Alberto Ambroj López
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <a
                  href="mailto:alber.ambroj@gmail.com"
                  className="block text-zinc-700 underline underline-offset-2 hover:text-black"
                >
                  alber.ambroj@gmail.com
                </a>
                <a
                  href="mailto:aambroj@yahoo.es"
                  className="block text-zinc-700 underline underline-offset-2 hover:text-black"
                >
                  aambroj@yahoo.es
                </a>
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
    <Suspense
      fallback={
        <section className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-10">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            Cargando...
          </div>
        </section>
      }
    >
      <LoginContent />
    </Suspense>
  );
}