"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function RegistroPage() {
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
          businessName,
          ownerName,
          slug: finalSlug,
          email,
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
        error instanceof Error ? error.message : "No se pudo crear la cuenta."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-screen bg-zinc-50">
      <div className="mx-auto grid min-h-screen max-w-7xl items-stretch px-6 py-8 lg:grid-cols-[1.12fr_540px] lg:gap-8 lg:px-8">
        <div className="hidden lg:flex">
          <div className="flex w-full flex-col justify-between rounded-[2rem] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-10 text-white shadow-sm">
            <div>
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                Peluque-Guía · Alta de nuevo negocio
              </div>

              <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight">
                Crea tu salón y empieza a gestionarlo desde un solo panel.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
                Registra tu peluquería, crea tu acceso privado y organiza
                reservas, clientes, equipo, servicios y disponibilidad online con
                una imagen más profesional y moderna.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold text-white">
                    Alta rápida
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Crea tu negocio y accede al panel en pocos pasos.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold text-white">
                    Enlace público propio
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Define el identificador de tu salón para las reservas
                    online.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold text-white">
                    Gestión diaria
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Organiza agenda, empleados, catálogo de servicios y
                    clientes desde un solo lugar.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold text-white">
                    Base preparada para crecer
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Estructura lista para suscripciones, multi-negocio y uso real
                    por peluquerías.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold text-white">
                  Pensado para negocio real
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Menos tiempo organizando tareas y más tiempo atendiendo mejor
                  a tus clientes.
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
              <p className="text-sm font-medium text-zinc-500">Nuevo salón</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
                Crear cuenta
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Registra tu peluquería y crea tu acceso al panel de gestión.
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
                    setBusinessName(event.target.value);
                    if (!slug.trim()) {
                      setSlug(slugify(event.target.value));
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
                    Este identificador será el nombre público de tu salón para la
                    reserva online.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Por ejemplo, si eliges{" "}
                    <span className="font-semibold text-zinc-900">
                      {finalPreviewSlug || "peluqueria-lola"}
                    </span>
                    , tus clientes accederán a:
                  </p>
                  <p className="mt-2 break-all rounded-xl bg-white px-3 py-2 text-sm text-zinc-800 border border-zinc-200">
                    https://peluque-guia.vercel.app/reservar/
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
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}