import Link from "next/link";
import { getServerBusinessContext } from "@/lib/supabase-server";
import CopyBookingUrlButton from "@/components/CopyBookingUrlButton";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://peluque-guia.vercel.app";

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
                Reserva pública online
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
                Reserva tu cita online
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
                Para reservar una cita necesitas acceder al enlace público de tu
                salón. Desde ahí podrás elegir profesional, consultar el
                calendario y seleccionar una hora libre real.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {businessSlug ? (
                  <a
                    href={publicBookingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Abrir mi web de reservas
                  </a>
                ) : null}

                <Link
                  href="/login"
                  className="inline-flex rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                >
                  Ir al acceso del panel
                </Link>

                <Link
                  href="/registro"
                  className="inline-flex rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                >
                  Crear negocio
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-700">
                  Selección de profesional
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-700">
                  Calendario visible
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-700">
                  Reserva online directa
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-[2rem] border border-zinc-200 bg-zinc-50 p-6">
                <p className="text-sm font-medium text-zinc-500">
                  Formato del enlace público
                </p>

                <div className="mt-3 rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-medium text-zinc-900 break-all">
                  {publicBookingUrl}
                </div>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  Ese es el formato que tendrá la web pública del salón para
                  recibir reservas online.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-sm font-semibold text-zinc-900">
                    Para clientes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Si has llegado aquí sin enlace, pide al salón que te
                    comparta su página pública de reservas.
                  </p>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-sm font-semibold text-zinc-900">
                    Para el dueño del salón
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Comparte este enlace por WhatsApp, Instagram, Google
                    Business o desde tu mostrador para recibir reservas online.
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
                  Tu web pública de reservas ya está lista
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
                  defaultLabel="Copiar enlace de tu web de reservas públicas"
                  copiedLabel="Enlace de reservas copiado"
                  className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                />

                <a
                  href={publicBookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-emerald-300 bg-white px-5 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
                >
                  Abrir web pública
                </a>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-amber-900">
              Aún no hay una web pública asociada a este acceso
            </h2>
            <p className="mt-2 text-sm text-amber-800">
              Cuando tu negocio tenga identificador configurado, aquí verás el
              enlace real de reservas online para compartirlo con clientes.
            </p>
          </section>
        )}

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Cómo funciona la reserva online
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Un proceso simple y claro para que el cliente reserve sin errores.
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
                El cliente entra en la web pública de reservas de su peluquería.
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
                Después podrá seleccionar el profesional disponible y el
                servicio que desea reservar.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                Paso 3
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                Escoger día y hora libre
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                El calendario mostrará la disponibilidad real para confirmar la
                cita online.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}