import Link from "next/link";
import { getServerBusinessContext } from "@/lib/supabase-server";
import CopyBookingUrlButton from "@/components/CopyBookingUrlButton";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://peluqueguia.es";

export default async function PublicBookingHomePage() {
  const { supabase, businessId } = await getServerBusinessContext();

  let businessSlug: string | null = null;

  if (businessId) {
    const { data: business } = await supabase
      .from("businesses")
      .select("slug")
      .eq("id", businessId)
      .maybeSingle();

    businessSlug = business?.slug ?? null;
  }

  const publicBookingUrl = businessSlug
    ? `${APP_URL}/reservar/${businessSlug}`
    : `${APP_URL}/reservar/nombre-del-salon`;

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-8 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
          <div className="grid gap-8 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                Reserva online
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
                Accede a la reserva online de tu salón
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
                La reserva online funciona a través del enlace público de cada
                peluquería. Desde ahí, el cliente puede elegir profesional,
                consultar disponibilidad real y pedir cita de forma directa.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {businessSlug ? (
                  <>
                    <a
                      href={publicBookingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Abrir mi página de reservas
                    </a>

                    <Link
                      href="/dashboard"
                      className="inline-flex rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                    >
                      Ir al panel
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                    >
                      Entrar al panel
                    </Link>

                    <Link
                      href="/registro"
                      className="inline-flex rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                    >
                      Crear negocio
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-700">
                  Enlace público propio
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-700">
                  Horarios reales
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-700">
                  Reserva online directa
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-[2rem] border border-zinc-200 bg-zinc-50 p-6">
                <p className="text-sm font-medium text-zinc-500">
                  Enlace público de ejemplo
                </p>

                <div className="mt-3 break-all rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-medium text-zinc-900">
                  {publicBookingUrl}
                </div>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  Este es el formato de la página pública que se comparte con
                  los clientes para reservar online.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-sm font-semibold text-zinc-900">
                    Si eres cliente
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Pide al salón su enlace directo de reservas para acceder a
                    su página pública.
                  </p>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-sm font-semibold text-zinc-900">
                    Si eres el dueño del salón
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Comparte tu enlace por WhatsApp, Instagram, Google Business
                    o desde tu mostrador para recibir reservas online.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {businessSlug ? (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-xl font-semibold text-emerald-900">
                  Tu página pública de reservas ya está lista
                </h2>
                <p className="mt-2 text-sm text-emerald-800">
                  Este es el enlace real que puedes compartir con tus clientes
                  para que reserven online directamente.
                </p>

                <a
                  href={publicBookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block break-all rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-900 underline underline-offset-2 hover:bg-emerald-100"
                >
                  {publicBookingUrl}
                </a>
              </div>

              <div className="flex flex-wrap gap-3">
                <CopyBookingUrlButton
                  value={publicBookingUrl}
                  defaultLabel="Copiar enlace de reservas"
                  copiedLabel="Enlace copiado"
                  className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                />

                <a
                  href={publicBookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-emerald-300 bg-white px-5 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
                >
                  Abrir página pública
                </a>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-amber-900">
              Todavía no hay una página pública lista para compartir
            </h2>
            <p className="mt-2 text-sm text-amber-800">
              Cuando el negocio tenga su identificador configurado, aquí verás
              el enlace real para enviar a clientes.
            </p>
          </section>
        )}

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Cómo funciona la reserva online
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Un proceso sencillo para que el cliente reserve sin confusión.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                Paso 1
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                Acceder al enlace del salón
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                El cliente entra en la página pública de reservas de su
                peluquería.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                Paso 2
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                Elegir profesional y servicio
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Después selecciona el profesional disponible y el servicio que
                quiere reservar.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                Paso 3
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                Escoger día y hora
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                El calendario muestra la disponibilidad real para confirmar la
                cita online.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}