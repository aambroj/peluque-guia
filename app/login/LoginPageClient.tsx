"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

function getSafeRedirect(value: string | null) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

function getFriendlyErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return "Email o contraseña incorrectos.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Tu email todavía no está confirmado.";
  }

  return message || "No se pudo iniciar sesión. Inténtalo de nuevo.";
}

export default function LoginPageClient() {
  const searchParams = useSearchParams();

  const redirectTo = useMemo(
    () => getSafeRedirect(searchParams.get("redirectTo")),
    [searchParams]
  );

  const successMessage = useMemo(() => {
    if (searchParams.get("passwordUpdated") === "1") {
      return "Tu contraseña se ha actualizado correctamente. Ya puedes acceder a tu cuenta.";
    }

    if (searchParams.get("recovery") === "sent") {
      return "Te hemos enviado las instrucciones de recuperación. Revisa tu correo para continuar.";
    }

    if (searchParams.get("registered") === "1") {
      return "Tu cuenta se ha creado correctamente. Ya puedes entrar al panel.";
    }

    return "";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(getFriendlyErrorMessage(error.message));
      setLoading(false);
      return;
    }

    window.location.href = redirectTo;
  }

  return (
    <section className="min-h-screen bg-transparent text-[#2f2430]">
      <div className="mx-auto grid min-h-screen max-w-7xl items-stretch px-6 py-8 lg:grid-cols-[1.08fr_480px] lg:gap-8 lg:px-8">
        <div className="hidden lg:flex">
          <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-[2rem] border border-white/40 bg-[linear-gradient(135deg,#6f3a52_0%,#86506a_52%,#a16b82_100%)] p-10 text-white shadow-[0_28px_90px_rgba(87,45,65,0.22)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.10),transparent_30%)]" />

            <div className="relative">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur-sm">
                PeluqueGuía · Gestión profesional para peluquerías
              </div>

              <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-tight tracking-tight">
                Accede a tu panel y gestiona tu salón con más orden.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/80">
                Controla citas, clientes, equipo, servicios y reservas online
                desde un solo panel. Una herramienta pensada para trabajar mejor
                hoy y dar una imagen más profesional mañana.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Agenda siempre clara
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    Organiza reservas, cambios, estados y disponibilidad sin
                    depender de papeles, llamadas o mensajes sueltos.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Equipo y servicios bajo control
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    Gestiona empleados, horarios, bloqueos, precios y duración
                    de cada servicio desde una sola herramienta.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Reserva online para clientes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    Comparte tu enlace público y permite que tus clientes
                    reserven de forma cómoda, directa y profesional.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Base preparada para crecer
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    Estructura moderna y preparada para acompañar la evolución
                    comercial de tu negocio.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">
                  Pensado para el día a día
                </p>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Menos tiempo organizando la agenda y más tiempo atendiendo
                  mejor a tus clientes.
                </p>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">
                  Soporte y contacto
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-medium text-white">Alberto Ambroj López</p>
                  <a
                    href="mailto:alber.ambroj@gmail.com"
                    className="block text-white/75 underline underline-offset-2 hover:text-white"
                  >
                    alber.ambroj@gmail.com
                  </a>
                  <a
                    href="mailto:aambroj@yahoo.es"
                    className="block text-white/75 underline underline-offset-2 hover:text-white"
                  >
                    aambroj@yahoo.es
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/82 shadow-[0_24px_80px_rgba(87,45,65,0.12)] backdrop-blur">
            <div className="border-b border-[#eadada] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,242,244,0.92))] px-8 py-8 sm:px-10">
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex rounded-full border border-[#e6d6d7] bg-white/90 px-3 py-1 text-xs font-medium text-[#7a6870]">
                  Acceso privado
                </div>

                <div className="flex items-center gap-4">
                  <Link
                    href="/contacto"
                    className="text-sm font-medium text-[#7a6870] underline underline-offset-2 hover:text-[#7c3f58]"
                  >
                    Contacto
                  </Link>
                  <Link
                    href="/"
                    className="text-sm font-medium text-[#7a6870] underline underline-offset-2 hover:text-[#7c3f58]"
                  >
                    Volver a la portada
                  </Link>
                </div>
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#2f2430]">
                Entrar al panel
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#6d5b64]">
                Accede a tu cuenta para gestionar reservas, clientes, empleados,
                servicios y la operativa diaria de tu negocio.
              </p>
            </div>

            <div className="px-8 py-8 sm:px-10">
              <div className="mb-6 rounded-2xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#faf2ef_100%)] p-4 lg:hidden">
                <p className="text-sm font-semibold text-[#2f2430]">
                  PeluqueGuía
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6d5b64]">
                  Gestiona tu salón, tus reservas online y tu equipo desde una
                  herramienta clara, moderna y profesional.
                </p>
              </div>

              {successMessage ? (
                <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                  {successMessage}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#5d4954]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    className="w-full rounded-2xl border border-[#dcc8ce] bg-white/95 px-4 py-3 text-sm text-[#2f2430] outline-none transition placeholder:text-[#a08d95] focus:border-[#9b5c74] focus:ring-4 focus:ring-[#e8d7de]"
                    placeholder="tuemail@negocio.com"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-[#5d4954]">
                      Contraseña
                    </label>

                    <Link
                      href="/recuperar-contrasena"
                      className="text-sm font-medium text-[#7c3f58] underline underline-offset-2 hover:text-[#5f3245]"
                    >
                      ¿Has olvidado tu contraseña?
                    </Link>
                  </div>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-[#dcc8ce] bg-white/95 px-4 py-3 text-sm text-[#2f2430] outline-none transition placeholder:text-[#a08d95] focus:border-[#9b5c74] focus:ring-4 focus:ring-[#e8d7de]"
                    placeholder="••••••••"
                  />

                  <div className="mt-3">
                    <Link
                      href="/contacto"
                      className="text-sm font-medium text-[#7a6870] underline underline-offset-2 hover:text-[#7c3f58]"
                    >
                      ¿No recuerdas con qué email entraste?
                    </Link>
                  </div>
                </div>

                {errorMessage ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#7c3f58] to-[#9b5c74] px-5 py-3.5 text-sm font-medium text-white shadow-lg shadow-[#7c3f58]/15 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Entrando..." : "Entrar al panel"}
                </button>
              </form>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#faf2ef_100%)] p-4">
                  <p className="text-sm font-medium text-[#2f2430]">
                    ¿Todavía no usas PeluqueGuía?
                  </p>
                  <p className="mt-1 text-sm text-[#6d5b64]">
                    Crea tu negocio y empieza a configurar tu salón.
                  </p>
                  <div className="mt-3">
                    <Link
                      href="/registro"
                      className="text-sm font-medium text-[#7c3f58] underline underline-offset-2 hover:text-[#5f3245]"
                    >
                      Crear negocio
                    </Link>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-900">
                    Empieza con más tranquilidad
                  </p>
                  <p className="mt-1 text-sm text-emerald-800">
                    El plan Basic está planteado con 30 días gratis antes del
                    cobro mensual.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-[#eadada] bg-white/80 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#8a7880]">
                      Reservas
                    </p>
                    <p className="mt-1 text-sm text-[#2f2430]">
                      Gestión clara y rápida
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#8a7880]">
                      Equipo
                    </p>
                    <p className="mt-1 text-sm text-[#2f2430]">
                      Horarios y bloqueos
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#8a7880]">
                      Negocio
                    </p>
                    <p className="mt-1 text-sm text-[#2f2430]">
                      Imagen y reservas online
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#f8f1f5_100%)] p-4 lg:hidden">
                  <p className="text-sm font-semibold text-[#2f2430]">
                    Soporte y contacto
                  </p>
                  <p className="mt-2 text-sm text-[#6d5b64]">
                    Alberto Ambroj López
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <a
                      href="mailto:alber.ambroj@gmail.com"
                      className="block text-[#6b4958] underline underline-offset-2 hover:text-[#7c3f58]"
                    >
                      alber.ambroj@gmail.com
                    </a>
                    <a
                      href="mailto:aambroj@yahoo.es"
                      className="block text-[#6b4958] underline underline-offset-2 hover:text-[#7c3f58]"
                    >
                      aambroj@yahoo.es
                    </a>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#f3edf7_100%)] p-4">
                  <p className="text-sm font-semibold text-[#2f2430]">
                    ¿Quieres hablar antes de empezar?
                  </p>
                  <p className="mt-2 text-sm text-[#6d5b64]">
                    Puedes ver la página de contacto y pedir una demo o más
                    información.
                  </p>
                  <div className="mt-3">
                    <Link
                      href="/contacto"
                      className="text-sm font-medium text-[#7c3f58] underline underline-offset-2 hover:text-[#5f3245]"
                    >
                      Ir a contacto
                    </Link>
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