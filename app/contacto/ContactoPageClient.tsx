"use client";

import Link from "next/link";
import { useState } from "react";

const contactReasons = [
  {
    title: "Solicitar una demo",
    description:
      "Para ver cómo encaja PeluqueGuía en tu salón antes de empezar.",
  },
  {
    title: "Resolver dudas",
    description:
      "Sobre planes, funcionamiento, reserva online o puesta en marcha.",
  },
  {
    title: "Valorar si te encaja",
    description:
      "Si tienes un salón pequeño o un equipo más grande y quieres saber qué plan te conviene.",
  },
];

const benefits = [
  "Respuesta directa por email",
  "Orientado a peluquerías reales",
  "Explicación clara del producto",
  "Sin procesos complicados",
];

const employeeOptions = [
  "Solo yo",
  "2 empleados",
  "3 a 5 empleados",
  "6 a 10 empleados",
  "Más de 10 empleados",
];

function getFriendlyErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("email")) {
    return "Revisa el email introducido.";
  }

  if (normalized.includes("mensaje")) {
    return "Escribe un poco más de detalle en el mensaje.";
  }

  return message || "No se pudo enviar la solicitud.";
}

export default function ContactoPageClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [employeesRange, setEmployeesRange] = useState("");
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage("Debes completar nombre, email y mensaje.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          businessName,
          phone,
          employeesRange,
          message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "No se pudo enviar la solicitud.");
      }

      setSuccessMessage(
        "Tu solicitud se ha enviado correctamente. Te responderemos lo antes posible."
      );
      setName("");
      setEmail("");
      setBusinessName("");
      setPhone("");
      setEmployeesRange("");
      setMessage("");
    } catch (error) {
      setErrorMessage(
        getFriendlyErrorMessage(
          error instanceof Error ? error.message : "No se pudo enviar la solicitud."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">
              PeluqueGuía
            </p>
            <p className="text-sm text-zinc-500">
              Contacto, información y solicitud de demo
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Volver a la portada
            </Link>
            <Link
              href="/registro"
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Crear negocio
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.06),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.04),transparent_24%)]" />

        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
              Contacto comercial
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
              Solicita información o una demo de PeluqueGuía
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
              Si quieres valorar si encaja con tu peluquería, resolver dudas
              sobre los planes o ver mejor cómo funciona la gestión diaria,
              puedes contactar directamente desde este formulario.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {benefits.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">
                Puedes escribir para
              </p>

              <div className="mt-5 grid gap-4">
                {contactReasons.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <h2 className="text-base font-semibold text-zinc-900">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-zinc-600">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">
                Contacto alternativo
              </p>
              <p className="mt-3 text-sm text-zinc-600">
                Alberto Ambroj López
              </p>
              <div className="mt-4 space-y-2 text-sm">
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

          <div>
            <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-200 bg-gradient-to-r from-white via-zinc-50 to-white px-8 py-8 sm:px-10">
                <div className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
                  Formulario de contacto
                </div>

                <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
                  Envíanos tu solicitud
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
                  Cuéntanos tu situación y te responderemos por email.
                </p>
              </div>

              <div className="px-8 py-8 sm:px-10">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                      placeholder="Tu nombre"
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
                      className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                      placeholder="tuemail@negocio.com"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      Nombre del salón
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                      placeholder="Peluquería Lola"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                        placeholder="600123123"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">
                        Tamaño del equipo
                      </label>
                      <select
                        value={employeesRange}
                        onChange={(event) => setEmployeesRange(event.target.value)}
                        className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                      >
                        <option value="">Selecciona una opción</option>
                        {employeeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      Mensaje
                    </label>
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      required
                      rows={6}
                      className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                      placeholder="Cuéntanos qué quieres valorar: agenda, reserva online, equipo, planes, demo..."
                    />
                  </div>

                  {successMessage ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                      {successMessage}
                    </div>
                  ) : null}

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
                    {loading ? "Enviando..." : "Enviar solicitud"}
                  </button>
                </form>

                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-900">
                    Consejo para pedir demo
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-800">
                    Indica el tamaño de tu salón y qué quieres valorar primero:
                    agenda, reserva online, equipo, servicios o planes.
                  </p>
                </div>

                <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Basic
                      </p>
                      <p className="mt-1 text-sm text-zinc-900">
                        Hasta 2 empleados
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Pro
                      </p>
                      <p className="mt-1 text-sm text-zinc-900">
                        Hasta 5 empleados
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Premium
                      </p>
                      <p className="mt-1 text-sm text-zinc-900">
                        Hasta 10 empleados
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-semibold text-zinc-900">
                    También puedes empezar directamente
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Si ya lo tienes claro, puedes crear tu negocio y comenzar la
                    configuración del salón desde ahora.
                  </p>

                  <div className="mt-4">
                    <Link
                      href="/registro"
                      className="text-sm font-medium text-black underline underline-offset-2"
                    >
                      Crear negocio
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">
                Información legal
              </p>
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                Consulta las páginas legales visibles del servicio.
              </p>

              <div className="mt-4 flex flex-col gap-2 text-sm">
                <Link
                  href="/privacidad"
                  className="text-zinc-700 underline underline-offset-2 hover:text-black"
                >
                  Política de privacidad
                </Link>
                <Link
                  href="/terminos"
                  className="text-zinc-700 underline underline-offset-2 hover:text-black"
                >
                  Términos y condiciones
                </Link>
                <Link
                  href="/cookies"
                  className="text-zinc-700 underline underline-offset-2 hover:text-black"
                >
                  Política de cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}