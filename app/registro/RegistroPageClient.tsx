"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://peluqueguia.es";

function slugify(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getFriendlyErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered")) {
    return "Ese email ya está registrado.";
  }

  if (normalized.includes("already exists")) {
    return "Ya existe un negocio o identificador con esos datos.";
  }

  if (normalized.includes("slug")) {
    return "Ese identificador del salón ya está en uso. Prueba con otro.";
  }

  return message || "No se pudo crear la cuenta.";
}

export default function RegistroPageClient() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestedSlug = useMemo(() => slugify(businessName), [businessName]);
  const finalPreviewSlug = slugify(slug || suggestedSlug);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const finalSlug = slugify(slug || suggestedSlug);

    if (
      !businessName.trim() ||
      !ownerName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword ||
      !finalSlug
    ) {
      setErrorMessage("Debes completar todos los campos.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
          ownerName: ownerName.trim(),
          slug: finalSlug,
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "No se pudo crear la cuenta.");
      }

      router.push("/login?registered=1");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        getFriendlyErrorMessage(
          error instanceof Error ? error.message : "No se pudo crear la cuenta."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-screen bg-zinc-50">
      <div className="mx-auto grid min-h-screen max-w-7xl items-stretch px-6 py-8 lg:grid-cols-[1.08fr_520px] lg:gap-8 lg:px-8">
        <div className="hidden lg:flex">
          <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-10 text-white shadow-sm">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)]" />

            <div className="relative">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                PeluqueGuía · Alta de nuevo negocio
              </div>

              <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-tight tracking-tight">
                Crea tu salón y empieza a gestionarlo desde un solo panel.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
                Registra tu peluquería, crea tu acceso privado y organiza
                reservas, clientes, equipo, servicios y disponibilidad online
                con una imagen más profesional, moderna y preparada para crecer.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Alta rápida
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Crea tu negocio y accede al panel en pocos pasos, sin
                    instalaciones ni configuraciones complicadas.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Enlace público propio
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Define el identificador de tu salón para que tus clientes
                    puedan reservar online con una URL clara y profesional.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Gestión diaria centralizada
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Organiza agenda, equipo, servicios y clientes desde una sola
                    herramienta.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">
                    Preparado para crecer
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Estructura moderna lista para suscripciones, crecimiento del
                    equipo y uso real por peluquerías.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">
                  Empieza con más tranquilidad
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  El plan Basic está planteado con 30 días gratis antes del
                  cobro mensual.
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
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
                  Nuevo salón
                </div>

                <div className="flex items-center gap-4">
                  <Link
                    href="/contacto"
                    className="text-sm font-medium text-zinc-500 underline underline-offset-2 hover:text-black"
                  >
                    Contacto
                  </Link>
                  <Link
                    href="/"
                    className="text-sm font-medium text-zinc-500 underline underline-offset-2 hover:text-black"
                  >
                    Volver a la portada
                  </Link>
                </div>
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
                Crear cuenta
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
                Registra tu peluquería y crea tu acceso al panel para empezar a
                trabajar con una base más profesional y ordenada.
              </p>
            </div>

            <div className="px-8 py-8 sm:px-10">
              <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 lg:hidden">
                <p className="text-sm font-semibold text-zinc-900">
                  PeluqueGuía
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Crea tu negocio, activa tu acceso y empieza a gestionar
                  reservas, clientes, servicios y equipo desde una sola
                  herramienta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Nombre del salón
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setBusinessName(nextValue);

                      if (!slug.trim()) {
                        setSlug(slugify(nextValue));
                      }
                    }}
                    required
                    autoComplete="organization"
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                    placeholder="Peluquería Lola"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Identificador del salón
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(event) => setSlug(slugify(event.target.value))}
                    required
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                    placeholder="peluqueria-lola"
                  />

                  <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm font-medium text-zinc-900">
                      Este identificador será el nombre público de tu salón para
                      la reserva online.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      Por ejemplo, si eliges{" "}
                      <span className="font-semibold text-zinc-900">
                        {finalPreviewSlug || "peluqueria-lola"}
                      </span>
                      , tus clientes accederán a:
                    </p>
                    <p className="mt-2 break-all rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800">
                      {APP_URL}/reservar/
                      <span className="font-semibold">
                        {finalPreviewSlug || "peluqueria-lola"}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Nombre del propietario
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(event) => setOwnerName(event.target.value)}
                    required
                    autoComplete="name"
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                    placeholder="Ana García"
                  />
                </div>

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
                    placeholder="admin@tusalon.com"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                      placeholder="••••••••"
                    />
                    <p className="mt-2 text-xs text-zinc-500">
                      Mínimo 6 caracteres.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      Repetir contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                      placeholder="••••••••"
                    />
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
                  className="w-full rounded-2xl bg-black px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </button>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm font-medium text-zinc-900">
                      ¿Ya tienes cuenta?
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Entra con tu acceso actual al panel.
                    </p>
                    <div className="mt-3">
                      <Link
                        href="/login"
                        className="text-sm font-medium text-black underline underline-offset-2"
                      >
                        Entrar
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-900">
                      Empieza con 30 días gratis
                    </p>
                    <p className="mt-1 text-sm text-emerald-800">
                      Ideal para probar la herramienta y configurar tu salón con
                      tranquilidad.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Reserva online
                      </p>
                      <p className="mt-1 text-sm text-zinc-900">
                        Enlace público propio
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Gestión
                      </p>
                      <p className="mt-1 text-sm text-zinc-900">
                        Clientes, equipo y servicios
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Crecimiento
                      </p>
                      <p className="mt-1 text-sm text-zinc-900">
                        Base sólida para escalar
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm font-semibold text-zinc-900">
                      ¿Prefieres hablar antes?
                    </p>
                    <p className="mt-2 text-sm text-zinc-600">
                      Puedes ir a la página de contacto y pedir una demo o más
                      información antes de registrarte.
                    </p>
                    <div className="mt-3">
                      <Link
                        href="/contacto"
                        className="text-sm font-medium text-black underline underline-offset-2"
                      >
                        Ir a contacto
                      </Link>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}