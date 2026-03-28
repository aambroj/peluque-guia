import type { Metadata } from "next";
import Link from "next/link";

const contactReasons = [
  {
    title: "Solicitar una demo",
    description:
      "Para ver cómo encaja Peluque-Guía en tu salón antes de empezar.",
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

export const metadata: Metadata = {
  title: "Contacto y demo | Peluque-Guía",
  description:
    "Contacta con Peluque-Guía para solicitar una demo, resolver dudas sobre planes o valorar si encaja con tu peluquería.",
  alternates: {
    canonical: "/contacto",
  },
  openGraph: {
    title: "Contacto y demo | Peluque-Guía",
    description:
      "Contacta con Peluque-Guía para solicitar una demo, resolver dudas sobre planes o valorar si encaja con tu peluquería.",
    url: "/contacto",
  },
  twitter: {
    title: "Contacto y demo | Peluque-Guía",
    description:
      "Contacta con Peluque-Guía para solicitar una demo, resolver dudas sobre planes o valorar si encaja con tu peluquería.",
  },
};

export default function ContactoPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">
              Peluque-Guía
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
              Solicita información o una demo de Peluque-Guía
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
              Si quieres valorar si encaja con tu peluquería, resolver dudas
              sobre los planes o ver mejor cómo funciona la gestión diaria,
              puedes contactar directamente.
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
          </div>

          <div>
            <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-200 bg-gradient-to-r from-white via-zinc-50 to-white px-8 py-8 sm:px-10">
                <div className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
                  Solicitud de demo
                </div>

                <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
                  Contacta directamente
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
                  La forma más simple de empezar es escribir por email indicando
                  el nombre de tu salón y qué quieres valorar.
                </p>
              </div>

              <div className="px-8 py-8 sm:px-10">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
                  <p className="text-sm font-semibold text-zinc-900">
                    Contacto principal
                  </p>
                  <p className="mt-3 text-sm text-zinc-600">
                    Alberto Ambroj López
                  </p>

                  <div className="mt-4 space-y-3">
                    <a
                      href="mailto:alber.ambroj@gmail.com?subject=Quiero%20una%20demo%20de%20Peluque-Gu%C3%ADa"
                      className="block rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                    >
                      alber.ambroj@gmail.com
                    </a>

                    <a
                      href="mailto:aambroj@yahoo.es?subject=Informaci%C3%B3n%20sobre%20Peluque-Gu%C3%ADa"
                      className="block rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                    >
                      aambroj@yahoo.es
                    </a>
                  </div>

                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-900">
                      Consejo para pedir demo
                    </p>
                    <p className="mt-2 text-sm leading-6 text-emerald-800">
                      En el mensaje puedes indicar el nombre de tu peluquería,
                      cuántas personas trabajan en el salón y si te interesa más
                      la agenda, la reserva online o la gestión general.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href="mailto:alber.ambroj@gmail.com?subject=Quiero%20una%20demo%20de%20Peluque-Gu%C3%ADa&body=Hola,%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20Peluque-Gu%C3%ADa.%0A%0ANombre%20del%20sal%C3%B3n%3A%0AN%C3%BAmero%20de%20empleados%3A%0AQu%C3%A9%20quiero%20valorar%3A"
                      className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      Pedir demo ahora
                    </a>

                    <Link
                      href="/cuenta/planes"
                      className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                    >
                      Ver planes
                    </Link>
                  </div>
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