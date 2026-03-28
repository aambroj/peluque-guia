"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPageClient() {
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
      <div className="mx-auto grid min-h-screen max-w-7xl items-stretch px-6 py-8 lg:grid-cols-[1.08fr_480px] lg:gap-8 lg:px-8">
        <div className="hidden lg:flex">
          <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-10 text-white shadow-sm">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)]" />

            <div className="relative">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                Peluque-Guía · Gestión profesional para peluquerías
              </div>

              <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-tight tracking-tight">
                Tu salón más ordenado, más profesional y más fácil de gestionar.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
                Controla citas, clientes, equipo, servicios y reservas online
                desde un solo panel. Una herramienta pensada para trabajar mejor
                hoy y crecer con una imagen sólida mañana.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Agenda siempre clara
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Organiza reservas, cambios, estados y disponibilidad sin
                    perder tiempo entre papeles o mensajes.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Equipo y servicios controlados
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Gestiona empleados, horarios, bloqueos, precios y duración
                    de cada servicio desde el panel.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Reservas online para clientes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Comparte tu enlace público y deja que tus clientes reserven
                    online de forma cómoda y directa.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Base sólida para crecer
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Estructura moderna, multi-negocio y preparada para una
                    evolución comercial real.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">
                  Pensado para el día a día
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Menos tiempo organizando citas y más tiempo atendiendo mejor a
                  tus clientes.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
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
          <div className="w-full overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 bg-gradient-to-r from-white via-zinc-50 to-white px-8 py-8 sm:px-10">
              <div className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
                Acceso privado
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
                Entrar al panel
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
                Accede a tu cuenta para gestionar reservas, clientes, empleados,
                servicios y la operativa diaria de tu negocio.
              </p>
            </div>

            <div className="px-8 py-8 sm:px-10">
              <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 lg:hidden">
                <p className="text-sm font-semibold text-zinc-900">
                  Peluque-Guía
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Gestiona tu salón, tus reservas online y tu equipo desde una
                  herramienta clara, moderna y profesional.
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
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-zinc-700">
                      Contraseña
                    </label>
                  </div>

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
                  {loading ? "Entrando..." : "Entrar al panel"}
                </button>
              </form>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
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

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 lg:hidden">
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

              <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Reservas
                    </p>
                    <p className="mt-1 text-sm text-zinc-900">
                      Gestión clara y rápida
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Equipo
                    </p>
                    <p className="mt-1 text-sm text-zinc-900">
                      Horarios y bloqueos
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Negocio
                    </p>
                    <p className="mt-1 text-sm text-zinc-900">
                      Imagen y reservas online
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}